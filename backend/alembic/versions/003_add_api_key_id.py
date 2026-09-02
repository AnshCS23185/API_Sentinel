"""add_api_key_id_to_api_requests

Revision ID: 003_add_api_key_id
Revises: 002_add_key_prefix_to_api_keys
Create Date: 2026-08-28

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '003_add_api_key_id'
down_revision: Union[str, None] = '002_add_key_prefix_to_api_keys'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('api_requests', sa.Column('api_key_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_api_requests_api_key_id'), 'api_requests', ['api_key_id'], unique=False)
    op.create_foreign_key(
        'fk_api_requests_api_key_id_api_keys',
        'api_requests',
        'api_keys',
        ['api_key_id'],
        ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    op.drop_constraint('fk_api_requests_api_key_id_api_keys', 'api_requests', type_='foreignkey')
    op.drop_index(op.f('ix_api_requests_api_key_id'), table_name='api_requests')
    op.drop_column('api_requests', 'api_key_id')
