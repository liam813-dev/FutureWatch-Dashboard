# Use this file for creating the migration file without database connectivity
# This way we can generate the migration files without a real database
# Later we'll run these migrations on the actual database

import os
from logging.config import fileConfig

from sqlalchemy import create_engine, pool
from alembic import context
import sys

# Add parent directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import models 
from app.core.database import Base
from app.models import (
    Asset,
    MarketSnapshot,
    Liquidation,
    TradeLarge,
    MacroPoint,
    BubbleOutlier,
    StablecoinFlow,
)

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Use SQLite for local migrations
config.set_main_option("sqlalchemy.url", "sqlite:///migration_test.db")

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.

def include_object(object, name, type_, reflected, compare_to):
    """Determine which database objects to include in the migration."""
    return True

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = create_engine(
        config.get_main_option("sqlalchemy.url"),
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_object=include_object,
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
