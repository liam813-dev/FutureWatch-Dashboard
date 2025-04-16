from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import os
from typing import AsyncGenerator

# Get database URL from environment variable and convert to asyncpg format
raw_url = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost/futurewatch")
DATABASE_URL = raw_url.replace("postgresql://", "postgresql+asyncpg://")

# Create async engine with connection pool configuration
engine = create_async_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    echo=False,
)

# Create async session maker
SessionLocal = sessionmaker(
    bind=engine, 
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
    class_=AsyncSession,
)

# Base class for models
Base = declarative_base()

# Dependency to use in FastAPI endpoints
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close() 