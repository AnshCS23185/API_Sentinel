"""add_api_key_id_to_rate_limit_violations

Revision ID: 005_violations_api_key_id
Revises: 004_analytics_indexes
Create Date: 2026-08-28

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '005_violations_api_key_id'
down_revision: Union[str, None] = '004_analytics_indexes'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('rate_limit_violations', sa.Column('api_key_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_rate_limit_violations_api_key_id'), 'rate_limit_violations', ['api_key_id'], unique=False)
    op.create_foreign_key(
        'fk_rate_limit_violations_api_key_id_api_keys',
        'rate_limit_violations',
        'api_keys',
        ['api_key_id'],
        ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    op.drop_constraint('fk_rate_limit_violations_api_key_id_api_keys', 'rate_limit_violations', type_='foreignkey')
    op.drop_index(op.f('ix_rate_limit_violations_api_key_id'), table_name='rate_limit_violations')
    op.drop_column('rate_limit_violations', 'api_key_id')
