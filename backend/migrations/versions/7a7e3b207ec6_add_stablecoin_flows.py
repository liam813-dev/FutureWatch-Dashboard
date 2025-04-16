"""add_stablecoin_flows

Revision ID: 7a7e3b207ec6
Revises: 01_init_schema
Create Date: 2025-04-16 16:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7a7e3b207ec6'
down_revision: Union[str, None] = '01_init_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create stablecoin_flows table
    op.create_table(
        'stablecoin_flows',
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('net', sa.Float(), nullable=False),
        sa.Column('circulating', sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint('date')
    )
    op.create_index('idx_stablecoin_flows_date', 'stablecoin_flows', ['date'], unique=False)


def downgrade() -> None:
    op.drop_table('stablecoin_flows')
