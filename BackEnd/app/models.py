from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Note(SQLModel, table=True):
    __tablename__ = "notes"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    heading: str = Field(default="")
    cue_text: str = Field(default="")
    summary_text: str = Field(default="")
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    boxes: list["NoteBox"] = Relationship(back_populates="note", cascade_delete=True)
    edges: list["NoteEdge"] = Relationship(back_populates="note", cascade_delete=True)


class NoteBox(SQLModel, table=True):
    __tablename__ = "note_boxes"
    __table_args__ = (UniqueConstraint("note_id", "local_id", name="uq_note_box_local"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    note_id: UUID = Field(foreign_key="notes.id", index=True, ondelete="CASCADE")
    local_id: int = Field(index=True)
    content: str = Field(default="")
    left: str = Field(default="0px")
    top: str = Field(default="20px")
    background_color: Optional[str] = None

    note: Optional[Note] = Relationship(back_populates="boxes")


class NoteEdge(SQLModel, table=True):
    __tablename__ = "note_edges"
    __table_args__ = (
        CheckConstraint("n1 < n2", name="ck_note_edge_order"),
        UniqueConstraint("note_id", "n1", "n2", name="uq_note_edge_endpoints"),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    note_id: UUID = Field(foreign_key="notes.id", index=True, ondelete="CASCADE")
    n1: int = Field()
    n2: int = Field()

    note: Optional[Note] = Relationship(back_populates="edges")
