"""add_key_prefix_to_api_keys

Revision ID: 002_add_key_prefix_to_api_keys
Revises: 001_initial_schema
Create Date: 2026-08-28

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002_add_key_prefix_to_api_keys'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add key_prefix as nullable column first to handle potential existing rows safely
    op.add_column('api_keys', sa.Column('key_prefix', sa.String(length=16), nullable=True))
    
    # 2. Populate existing NULL rows with a safe fallback prefix
    # NOTE: Plaintext raw keys are never stored or reconstructed; existing legacy rows are populated with a safe migration fallback prefix.
    op.execute("UPDATE api_keys SET key_prefix = 'sen_live_0000000' WHERE key_prefix IS NULL")
    
    # 3. Alter key_prefix column to NOT NULL
    op.alter_column('api_keys', 'key_prefix', nullable=False)
    
    # 4. Create index on key_prefix
    op.create_index(op.f('ix_api_keys_key_prefix'), 'api_keys', ['key_prefix'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_api_keys_key_prefix'), table_name='api_keys')
    op.drop_column('api_keys', 'key_prefix')
