"""add_analytics_composite_indexes

Revision ID: 004_analytics_indexes
Revises: 003_add_api_key_id
Create Date: 2026-08-28

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '004_analytics_indexes'
down_revision: Union[str, None] = '003_add_api_key_id'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        'ix_api_requests_ts_status',
        'api_requests',
        ['timestamp', 'status_code'],
        unique=False
    )
    op.create_index(
        'ix_api_requests_ts_consumer',
        'api_requests',
        ['timestamp', 'consumer_id'],
        unique=False
    )
    op.create_index(
        'ix_api_requests_ts_endpoint',
        'api_requests',
        ['timestamp', 'endpoint_id'],
        unique=False
    )


def downgrade() -> None:
    op.drop_index('ix_api_requests_ts_endpoint', table_name='api_requests')
    op.drop_index('ix_api_requests_ts_consumer', table_name='api_requests')
    op.drop_index('ix_api_requests_ts_status', table_name='api_requests')
