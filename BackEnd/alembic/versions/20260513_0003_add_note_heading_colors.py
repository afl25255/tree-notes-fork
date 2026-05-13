"""add note heading colors

Revision ID: 20260513_0003
Revises: 20260513_0002
Create Date: 2026-05-13

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260513_0003"
down_revision: Union[str, None] = "20260513_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("notes", sa.Column("heading_background_color", sa.String(), nullable=True))
    op.add_column("notes", sa.Column("heading_text_color", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("notes", "heading_text_color")
    op.drop_column("notes", "heading_background_color")
