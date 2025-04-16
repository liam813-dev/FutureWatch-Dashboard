#!/usr/bin/env bash
docker run -d \
  --name future-pg \
  -e POSTGRES_PASSWORD=devpass \
  -e POSTGRES_DB=futurewatch_db \
  -p 5432:5432 \
  postgres:16-alpine
echo 'export DATABASE_URL=postgresql+asyncpg://postgres:devpass@localhost:5432/futurewatch_db'
echo 'Run:  export DATABASE_URL=... && alembic upgrade head' 