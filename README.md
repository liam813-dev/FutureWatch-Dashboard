# FutureWatch

Real-time cryptocurrency market data dashboard.

## Features

- Live market data for major cryptocurrencies
- Real-time price charts with WebSocket updates
- Liquidation feed and large trade detection
- Market insights and analytics
- Bubble detection for overextended price movements
- Stablecoin flow monitoring and supply tracking

## Architecture

- **Backend**: FastAPI + async SQLAlchemy 2.x
- **Worker**: Continuous ingest worker for market data
- **Frontend**: Next.js 14
- **Database**: PostgreSQL for durable storage
- **Deploy**: Render web service and worker

## ⚙️ Database Setup

The project uses PostgreSQL with SQLAlchemy for data persistence. Follow these steps to set up the database:

### Local Development

1. Install PostgreSQL locally or use a Docker container:

```bash
# Using Docker
docker run --name futurewatch-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=futurewatch -p 5432:5432 -d postgres
```

2. Set the DATABASE_URL environment variable:

```bash
# For local development
export DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost/futurewatch
```

3. Run the Alembic migrations to create the database schema:

```bash
cd backend
alembic upgrade head
```

### Running Migrations

To create a new migration after changing the models:

```bash
cd backend
alembic revision --autogenerate -m "describe_your_changes"
```

To apply migrations:

```bash
cd backend
alembic upgrade head
```

### Production Deployment

For production deployment on Render:

1. The DATABASE_URL is configured via environment variable groups in render.yaml
2. Migrations are run automatically during the build process
3. Ensure the web service and worker service have access to the same database

### Local Postgres
```bash
./scripts/dev-postgres.sh        # starts docker postgres
export $(./scripts/dev-postgres.sh | tail -1)   # sets DATABASE_URL
cd backend && alembic upgrade head
uvicorn server:app --reload
```
If DATABASE_URL is unset, the app falls back to SQLite (migration_test.db).

## Stablecoin Flow Monitoring

The dashboard includes a stablecoin flow monitoring feature that tracks:

- 24-hour net issuance/minting/burning
- Total circulating supply
- Percentage change in supply

Data is sourced from llama.fi's stablecoin API and updated every minute. The feature helps track:

- Market liquidity conditions
- Stablecoin supply dynamics
- Potential market impact of large minting/burning events

## Development Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
python server.py
```

### Worker

```bash
cd backend
python worker/ingest.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Verification

After deployment, you can verify the setup by checking the API endpoints:

```bash
# Check health endpoint
curl https://your-app-url.onrender.com/health

# Fetch dashboard data
curl https://your-app-url.onrender.com/api/data

# Fetch bubble outliers
curl https://your-app-url.onrender.com/api/bubbles
```

## License

MIT