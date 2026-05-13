"""add note box text color

Revision ID: 20260513_0002
Revises: 20260417_0001
Create Date: 2026-05-13

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260513_0002"
down_revision: Union[str, None] = "20260417_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("note_boxes", sa.Column("text_color", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("note_boxes", "text_color")
