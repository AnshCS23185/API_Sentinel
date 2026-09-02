"""initial_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-26

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. admin_users
    op.create_table(
        'admin_users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_admin_users_email'), 'admin_users', ['email'], unique=True)
    op.create_index(op.f('ix_admin_users_id'), 'admin_users', ['id'], unique=False)

    # 2. rate_limit_plans
    op.create_table(
        'rate_limit_plans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('requests_per_window', sa.Integer(), nullable=False),
        sa.Column('window_seconds', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_rate_limit_plans_id'), 'rate_limit_plans', ['id'], unique=False)

    # 3. api_consumers
    op.create_table(
        'api_consumers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='active', nullable=False),
        sa.Column('plan_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['plan_id'], ['rate_limit_plans.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_api_consumers_id'), 'api_consumers', ['id'], unique=False)
    op.create_index(op.f('ix_api_consumers_name'), 'api_consumers', ['name'], unique=False)
    op.create_index(op.f('ix_api_consumers_plan_id'), 'api_consumers', ['plan_id'], unique=False)

    # 4. api_keys
    op.create_table(
        'api_keys',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('consumer_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('key_hash', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['consumer_id'], ['api_consumers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_api_keys_consumer_id'), 'api_keys', ['consumer_id'], unique=False)
    op.create_index(op.f('ix_api_keys_id'), 'api_keys', ['id'], unique=False)
    op.create_index(op.f('ix_api_keys_key_hash'), 'api_keys', ['key_hash'], unique=True)

    # 5. api_endpoints
    op.create_table(
        'api_endpoints',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('path', sa.String(length=512), nullable=False),
        sa.Column('method', sa.String(length=10), nullable=False),
        sa.Column('target_url', sa.String(length=1024), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('method', 'path', name='uq_api_endpoints_method_path')
    )
    op.create_index(op.f('ix_api_endpoints_id'), 'api_endpoints', ['id'], unique=False)
    op.create_index(op.f('ix_api_endpoints_path'), 'api_endpoints', ['path'], unique=False)

    # 6. api_requests
    op.create_table(
        'api_requests',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('consumer_id', sa.Integer(), nullable=True),
        sa.Column('endpoint_id', sa.Integer(), nullable=True),
        sa.Column('method', sa.String(length=10), nullable=False),
        sa.Column('path', sa.String(length=512), nullable=False),
        sa.Column('status_code', sa.Integer(), nullable=False),
        sa.Column('response_time_ms', sa.Float(), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=512), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['consumer_id'], ['api_consumers.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['endpoint_id'], ['api_endpoints.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_api_requests_consumer_id'), 'api_requests', ['consumer_id'], unique=False)
    op.create_index(op.f('ix_api_requests_endpoint_id'), 'api_requests', ['endpoint_id'], unique=False)
    op.create_index(op.f('ix_api_requests_id'), 'api_requests', ['id'], unique=False)
    op.create_index(op.f('ix_api_requests_timestamp'), 'api_requests', ['timestamp'], unique=False)

    # 7. rate_limit_violations
    op.create_table(
        'rate_limit_violations',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('consumer_id', sa.Integer(), nullable=False),
        sa.Column('endpoint_id', sa.Integer(), nullable=True),
        sa.Column('limit', sa.Integer(), nullable=False),
        sa.Column('request_count', sa.Integer(), nullable=False),
        sa.Column('window_seconds', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['consumer_id'], ['api_consumers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['endpoint_id'], ['api_endpoints.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_rate_limit_violations_consumer_id'), 'rate_limit_violations', ['consumer_id'], unique=False)
    op.create_index(op.f('ix_rate_limit_violations_endpoint_id'), 'rate_limit_violations', ['endpoint_id'], unique=False)
    op.create_index(op.f('ix_rate_limit_violations_id'), 'rate_limit_violations', ['id'], unique=False)
    op.create_index(op.f('ix_rate_limit_violations_timestamp'), 'rate_limit_violations', ['timestamp'], unique=False)


def downgrade() -> None:
    op.drop_table('rate_limit_violations')
    op.drop_table('api_requests')
    op.drop_table('api_endpoints')
    op.drop_table('api_keys')
    op.drop_table('api_consumers')
    op.drop_table('rate_limit_plans')
    op.drop_table('admin_users')
