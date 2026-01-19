"""Increase ticket id column size

Revision ID: 001_ticket_id
Revises: 
Create Date: 2026-01-19 11:40:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_ticket_id'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Increase the id column size from VARCHAR(20) to VARCHAR(100)
    op.alter_column('tickets', 'id',
                    existing_type=sa.String(length=20),
                    type_=sa.String(length=100),
                    existing_nullable=False)


def downgrade():
    # Revert back to VARCHAR(20)
    op.alter_column('tickets', 'id',
                    existing_type=sa.String(length=100),
                    type_=sa.String(length=20),
                    existing_nullable=False)
