"""init_schema

Revision ID: 01_init_schema
Revises: 
Create Date: 2023-06-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '01_init_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # assets table
    op.create_table(
        'assets',
        sa.Column('symbol', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('market_cap', sa.Float(), nullable=True),
        sa.Column('circulating_supply', sa.Float(), nullable=True),
        sa.Column('max_supply', sa.Float(), nullable=True),
        sa.Column('website_url', sa.String(), nullable=True),
        sa.Column('explorer_url', sa.String(), nullable=True),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('logo_url', sa.String(), nullable=True),
        sa.Column('ts_updated', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('symbol')
    )
    op.create_index(op.f('ix_assets_symbol'), 'assets', ['symbol'], unique=False)
    
    # market_snapshots table
    op.create_table(
        'market_snapshots',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('symbol', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('open', sa.Float(), nullable=True),
        sa.Column('high', sa.Float(), nullable=True),
        sa.Column('low', sa.Float(), nullable=True),
        sa.Column('close', sa.Float(), nullable=True),
        sa.Column('volume', sa.Float(), nullable=True),
        sa.Column('volume_24h', sa.Float(), nullable=True),
        sa.Column('percent_change_1h', sa.Float(), nullable=True),
        sa.Column('percent_change_24h', sa.Float(), nullable=True),
        sa.Column('percent_change_7d', sa.Float(), nullable=True),
        sa.Column('ts_created', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_market_snapshots_symbol'), 'market_snapshots', ['symbol'], unique=False)
    op.create_index(op.f('ix_market_snapshots_timestamp'), 'market_snapshots', ['timestamp'], unique=False)
    op.create_index('idx_market_snapshots_symbol_timestamp', 'market_snapshots', ['symbol', 'timestamp'], unique=False)
    
    # liquidations table
    op.create_table(
        'liquidations',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('symbol', sa.String(), nullable=False),
        sa.Column('side', sa.String(), nullable=False),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('exchange', sa.String(), nullable=True),
        sa.Column('value_usd', sa.Float(), nullable=False),
        sa.Column('position_size', sa.Float(), nullable=True),
        sa.Column('leverage', sa.Integer(), nullable=True),
        sa.Column('ts_created', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_liquidations_symbol'), 'liquidations', ['symbol'], unique=False)
    op.create_index(op.f('ix_liquidations_timestamp'), 'liquidations', ['timestamp'], unique=False)
    op.create_index('idx_liquidations_timestamp', 'liquidations', ['timestamp'], unique=False)
    
    # trades_large table
    op.create_table(
        'trades_large',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('symbol', sa.String(), nullable=False),
        sa.Column('side', sa.String(), nullable=False),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('value_usd', sa.Float(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('exchange', sa.String(), nullable=True),
        sa.Column('is_liquidation', sa.String(), nullable=True),
        sa.Column('ts_created', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_trades_large_symbol'), 'trades_large', ['symbol'], unique=False)
    op.create_index(op.f('ix_trades_large_timestamp'), 'trades_large', ['timestamp'], unique=False)
    op.create_index('idx_trades_large_timestamp', 'trades_large', ['timestamp'], unique=False)
    
    # macro_points table
    op.create_table(
        'macro_points',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('indicator', sa.String(), nullable=False),
        sa.Column('value', sa.Float(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('previous_value', sa.Float(), nullable=True),
        sa.Column('percent_change', sa.Float(), nullable=True),
        sa.Column('country', sa.String(), nullable=True),
        sa.Column('source', sa.String(), nullable=True),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('ts_created', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_macro_points_indicator'), 'macro_points', ['indicator'], unique=False)
    op.create_index(op.f('ix_macro_points_timestamp'), 'macro_points', ['timestamp'], unique=False)
    op.create_index('idx_macro_points_indicator_timestamp', 'macro_points', ['indicator', 'timestamp'], unique=False)
    
    # bubble_outliers table
    op.create_table(
        'bubble_outliers',
        sa.Column('symbol', sa.String(), nullable=False),
        sa.Column('z_score', sa.Float(), nullable=False),
        sa.Column('current_price', sa.Float(), nullable=False),
        sa.Column('baseline_price', sa.Float(), nullable=True),
        sa.Column('percent_deviation', sa.Float(), nullable=True),
        sa.Column('rank', sa.Integer(), nullable=True),
        sa.Column('direction', sa.String(), nullable=True),
        sa.Column('lookback_days', sa.Integer(), nullable=True),
        sa.Column('detection_method', sa.String(), nullable=True),
        sa.Column('ts_updated', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('symbol')
    )
    op.create_index('idx_bubble_outliers_z_score', 'bubble_outliers', ['z_score'], unique=False)


def downgrade() -> None:
    op.drop_table('bubble_outliers')
    op.drop_table('macro_points')
    op.drop_table('trades_large')
    op.drop_table('liquidations')
    op.drop_table('market_snapshots')
    op.drop_table('assets') 