from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import Note, utcnow
from app.note_payload import apply_note_payload, get_note_or_none, note_to_document
from app.schemas import NoteCreate, NoteDocument, NoteSummary, NoteUpdate

router = APIRouter(prefix="/notes", tags=["notes"])


def _validate_box_ids(payload: NoteCreate | NoteUpdate) -> None:
    seen: set[int] = set()
    for b in payload.boxes:
        if b.id in seen:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Duplicate box id in payload: {b.id}",
            )
        seen.add(b.id)


@router.get("", response_model=list[NoteSummary])
def list_notes(session: Session = Depends(get_session)) -> list[NoteSummary]:
    notes = session.exec(select(Note).order_by(Note.updated_at.desc())).all()
    return [
        NoteSummary(id=n.id, heading=n.heading, updated_at=n.updated_at)
        for n in notes
    ]


@router.post("", response_model=NoteDocument, status_code=status.HTTP_201_CREATED)
def create_note(
    session: Session = Depends(get_session),
    body: Optional[NoteCreate] = Body(default=None),
) -> NoteDocument:
    payload = body or NoteCreate()
    _validate_box_ids(payload)
    note = Note(
        heading=payload.heading,
        cue_text=payload.cueText,
        summary_text=payload.summary,
        created_at=utcnow(),
        updated_at=utcnow(),
    )
    session.add(note)
    session.commit()
    session.refresh(note)
    apply_note_payload(note, NoteUpdate.model_validate(payload.model_dump()), session)
    session.commit()
    return note_to_document(note, session)


@router.get("/{note_id}", response_model=NoteDocument)
def get_note(note_id: UUID, session: Session = Depends(get_session)) -> NoteDocument:
    note = get_note_or_none(session, note_id)
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note_to_document(note, session)


@router.put("/{note_id}", response_model=NoteDocument)
def replace_note(
    note_id: UUID,
    body: NoteUpdate,
    session: Session = Depends(get_session),
) -> NoteDocument:
    _validate_box_ids(body)
    note = get_note_or_none(session, note_id)
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    apply_note_payload(note, body, session)
    session.commit()
    session.refresh(note)
    return note_to_document(note, session)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note_id: UUID, session: Session = Depends(get_session)) -> None:
    note = get_note_or_none(session, note_id)
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    session.delete(note)
    session.commit()
