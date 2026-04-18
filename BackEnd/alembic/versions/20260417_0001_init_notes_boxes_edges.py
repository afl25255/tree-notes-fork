"""init notes boxes edges

Revision ID: 20260417_0001
Revises:
Create Date: 2026-04-17

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260417_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("heading", sa.String(), nullable=False),
        sa.Column("cue_text", sa.String(), nullable=False),
        sa.Column("summary_text", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "note_boxes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("note_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("local_id", sa.Integer(), nullable=False),
        sa.Column("content", sa.String(), nullable=False),
        sa.Column("left", sa.String(), nullable=False),
        sa.Column("top", sa.String(), nullable=False),
        sa.Column("background_color", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["note_id"], ["notes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("note_id", "local_id", name="uq_note_box_local"),
    )
    op.create_index(op.f("ix_note_boxes_note_id"), "note_boxes", ["note_id"], unique=False)
    op.create_index(op.f("ix_note_boxes_local_id"), "note_boxes", ["local_id"], unique=False)
    op.create_table(
        "note_edges",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("note_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("n1", sa.Integer(), nullable=False),
        sa.Column("n2", sa.Integer(), nullable=False),
        sa.CheckConstraint("n1 < n2", name="ck_note_edge_order"),
        sa.ForeignKeyConstraint(["note_id"], ["notes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("note_id", "n1", "n2", name="uq_note_edge_endpoints"),
    )
    op.create_index(op.f("ix_note_edges_note_id"), "note_edges", ["note_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_note_edges_note_id"), table_name="note_edges")
    op.drop_table("note_edges")
    op.drop_index(op.f("ix_note_boxes_local_id"), table_name="note_boxes")
    op.drop_index(op.f("ix_note_boxes_note_id"), table_name="note_boxes")
    op.drop_table("note_boxes")
    op.drop_table("notes")
