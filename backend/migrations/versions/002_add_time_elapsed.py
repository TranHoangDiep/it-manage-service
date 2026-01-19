"""Add time_elapsed_minutes column to tickets table

Run this migration on the server:
    flask db upgrade
    
Or manually:
    psql -U postgres -d itsm_report -c "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS time_elapsed_minutes INTEGER;"
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002_add_time_elapsed'
down_revision = '001_increase_ticket_id_size'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('tickets', sa.Column('time_elapsed_minutes', sa.Integer(), nullable=True))


def downgrade():
    op.drop_column('tickets', 'time_elapsed_minutes')
