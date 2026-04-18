"""Map between API `NoteDocument` and DB rows (`Note`, `NoteBox`, `NoteEdge`)."""

from __future__ import annotations

from uuid import UUID

from sqlmodel import Session, select

from app.models import Note, NoteBox, NoteEdge, utcnow
from app.schemas import BoxInOut, BoxStyle, NoteDocument, NoteUpdate


def _canonical_edge(a: int, b: int) -> tuple[int, int]:
    return (a, b) if a < b else (b, a)


def edges_from_boxes(boxes: list[BoxInOut]) -> set[tuple[int, int]]:
    pairs: set[tuple[int, int]] = set()
    ids = {b.id for b in boxes}
    for box in boxes:
        for target in box.lines:
            tid = int(target)
            if tid not in ids or tid == box.id:
                continue
            pairs.add(_canonical_edge(box.id, tid))
    return pairs


def apply_note_payload(note: Note, payload: NoteUpdate, session: Session) -> None:
    note.heading = payload.heading
    note.cue_text = payload.cueText
    note.summary_text = payload.summary
    note.updated_at = utcnow()

    for row in session.exec(select(NoteBox).where(NoteBox.note_id == note.id)).all():
        session.delete(row)
    for row in session.exec(select(NoteEdge).where(NoteEdge.note_id == note.id)).all():
        session.delete(row)
    session.flush()

    for b in payload.boxes:
        style = b.style
        session.add(
            NoteBox(
                note_id=note.id,
                local_id=b.id,
                content=b.content,
                left=style.left,
                top=style.top,
                background_color=style.backgroundColor,
            )
        )

    for n1, n2 in edges_from_boxes(payload.boxes):
        session.add(NoteEdge(note_id=note.id, n1=n1, n2=n2))


def note_to_document(note: Note, session: Session) -> NoteDocument:
    boxes_db = session.exec(
        select(NoteBox).where(NoteBox.note_id == note.id).order_by(NoteBox.local_id)
    ).all()
    edges = session.exec(select(NoteEdge).where(NoteEdge.note_id == note.id)).all()

    neighbors: dict[int, set[int]] = {b.local_id: set() for b in boxes_db}
    for e in edges:
        ns_a = neighbors.get(e.n1)
        ns_b = neighbors.get(e.n2)
        if ns_a is None or ns_b is None:
            continue
        ns_a.add(e.n2)
        ns_b.add(e.n1)

    boxes_out: list[BoxInOut] = []
    for b in boxes_db:
        nbrs = neighbors.get(b.local_id, set())
        boxes_out.append(
            BoxInOut(
                id=b.local_id,
                content=b.content,
                style=BoxStyle(
                    left=b.left,
                    top=b.top,
                    backgroundColor=b.background_color,
                ),
                lines=[str(x) for x in sorted(nbrs)],
            )
        )

    return NoteDocument(
        heading=note.heading,
        cueText=note.cue_text,
        summary=note.summary_text,
        boxes=boxes_out,
    )


def get_note_or_none(session: Session, note_id: UUID) -> Note | None:
    return session.get(Note, note_id)
