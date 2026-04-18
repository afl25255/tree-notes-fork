from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class BoxStyle(BaseModel):
    left: str = "0px"
    top: str = "20px"
    backgroundColor: Optional[str] = None


class BoxInOut(BaseModel):
    """Matches frontend `download()` / `upload()` box objects."""

    id: int
    content: str = ""
    style: BoxStyle = Field(default_factory=BoxStyle)
    lines: list[str] = Field(default_factory=list)

    @field_validator("id", mode="before")
    @classmethod
    def coerce_id(cls, v: Any) -> int:
        return int(v)


class NoteDocument(BaseModel):
    """Full note payload aligned with frontend JSON export."""

    heading: str = ""
    cueText: str = ""
    summary: str = ""
    boxes: list[BoxInOut] = Field(default_factory=list)


class NoteSummary(BaseModel):
    id: UUID
    heading: str
    updated_at: datetime


class NoteCreate(BaseModel):
    heading: str = ""
    cueText: str = ""
    summary: str = ""
    boxes: list[BoxInOut] = Field(default_factory=list)


class NoteUpdate(BaseModel):
    """Full replace of note content (same shape as export)."""

    heading: str = ""
    cueText: str = ""
    summary: str = ""
    boxes: list[BoxInOut] = Field(default_factory=list)
