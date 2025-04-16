import os, pathlib
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

DEFAULT_SQLITE_URL = "sqlite+aiosqlite:///migration_test.db"
url = os.getenv("DATABASE_URL", DEFAULT_SQLITE_URL)

# Convert postgres:// → postgresql+asyncpg:// for SQLAlchemy
if url.startswith("postgres://"):
    url = url.replace("postgres://", "postgresql+asyncpg://", 1)

# Configure engine based on database type
if url.startswith("postgresql"):
    engine = create_async_engine(url, pool_size=5, max_overflow=10, echo=False)
else:
    # SQLite doesn't support pool_size and max_overflow
    engine = create_async_engine(url, echo=False)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

# Dependency to use in FastAPI endpoints
async def get_db():
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close() 