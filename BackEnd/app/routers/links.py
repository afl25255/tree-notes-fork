from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import Note, NoteEdge
from app.schemas import LinkCreate, LinkOut

router = APIRouter(prefix="/links", tags=["links"])


def _canonical_pair(a: int, b: int) -> tuple[int, int]:
    return (a, b) if a < b else (b, a)


def _ensure_note_exists(session: Session, note_id: UUID) -> None:
    if session.get(Note, note_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")


@router.get("/list", response_model=list[LinkOut])
def list_links(note_id: UUID, session: Session = Depends(get_session)) -> list[LinkOut]:
    _ensure_note_exists(session, note_id)
    edges = session.exec(
        select(NoteEdge).where(NoteEdge.note_id == note_id).order_by(NoteEdge.n1, NoteEdge.n2)
    ).all()
    return [LinkOut(note_id=e.note_id, a=e.n1, b=e.n2) for e in edges]


@router.post("/create", response_model=LinkOut, status_code=status.HTTP_201_CREATED)
def create_link(body: LinkCreate, session: Session = Depends(get_session)) -> LinkOut:
    _ensure_note_exists(session, body.note_id)
    if body.a == body.b:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cannot link a box to itself",
        )
    n1, n2 = _canonical_pair(int(body.a), int(body.b))

    existing = session.exec(
        select(NoteEdge).where(
            NoteEdge.note_id == body.note_id, NoteEdge.n1 == n1, NoteEdge.n2 == n2
        )
    ).first()
    if existing is not None:
        return LinkOut(note_id=existing.note_id, a=existing.n1, b=existing.n2)

    edge = NoteEdge(note_id=body.note_id, n1=n1, n2=n2)
    session.add(edge)
    session.commit()
    return LinkOut(note_id=edge.note_id, a=edge.n1, b=edge.n2)


@router.post("/delete", status_code=status.HTTP_204_NO_CONTENT)
def delete_link(body: LinkCreate, session: Session = Depends(get_session)) -> None:
    _ensure_note_exists(session, body.note_id)
    if body.a == body.b:
        return
    n1, n2 = _canonical_pair(int(body.a), int(body.b))
    edge = session.exec(
        select(NoteEdge).where(
            NoteEdge.note_id == body.note_id, NoteEdge.n1 == n1, NoteEdge.n2 == n2
        )
    ).first()
    if edge is None:
        return
    session.delete(edge)
    session.commit()

