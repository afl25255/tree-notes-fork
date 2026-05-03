from datetime import datetime
from typing import Any, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class BoxStyle(BaseModel):
    left: str = "0px"
    top: str = "20px"
    backgroundColor: Optional[str] = None

    @field_validator("left", "top", mode="before")
    @classmethod
    def coerce_empty_to_default(cls, v: Any, info):
        # Frontend exports may contain empty strings for unset style fields.
        if v is None:
            return v
        if isinstance(v, str) and not v.strip():
            return "0px" if info.field_name == "left" else "20px"
        return v


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

    @field_validator("lines", mode="before")
    @classmethod
    def coerce_lines(cls, v: Any) -> list[str]:
        if v is None:
            return []
        if isinstance(v, (str, int)):
            return [str(v)]
        if isinstance(v, list):
            return [str(x) for x in v]
        return []


class NoteDocument(BaseModel):
    """Full note payload aligned with frontend JSON export."""

    id: Optional[UUID] = None
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


class LinkCreate(BaseModel):
    note_id: UUID
    a: int
    b: int


class LinkOut(BaseModel):
    note_id: UUID
    a: int
    b: int


class AiAnalyzeRequest(NoteUpdate):
    """Cornell note body for `/ai/analyze` (same JSON shape as a note export / PUT body)."""


class SuggestedLinkPair(BaseModel):
    a: int
    b: int


class AiAnalyzeOut(BaseModel):
    status: Literal["ok", "placeholder", "error"] = "placeholder"
    message: str = ""
    analysis: str = ""
    concepts: list[str] = Field(default_factory=list)
    suggested_links: list[SuggestedLinkPair] = Field(default_factory=list)
