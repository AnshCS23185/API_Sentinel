"""add_missing_fields

Revision ID: 006_add_missing_fields
Revises: 005_violations_api_key_id
Create Date: 2026-09-05

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '006_add_missing_fields'
down_revision: Union[str, None] = '005_violations_api_key_id'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('api_consumers', sa.Column('email', sa.String(length=255), nullable=True))
    op.add_column('rate_limit_plans', sa.Column('description', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('rate_limit_plans', 'description')
    op.drop_column('api_consumers', 'email')
