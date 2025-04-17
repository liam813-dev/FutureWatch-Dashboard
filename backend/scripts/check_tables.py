from app.core.database import engine
from sqlalchemy import text
import asyncio

async def check_tables():
    async with engine.connect() as conn:
        tables = ['market_snapshots', 'liquidations', 'macro_points', 'trades_large']
        for table in tables:
            try:
                result = await conn.execute(text(f'SELECT COUNT(*) FROM {table}'))
                count = result.scalar()
                print(f'{table}: {count} rows')
            except Exception as e:
                print(f'Error checking {table}: {str(e)}')

if __name__ == "__main__":
    asyncio.run(check_tables()) 