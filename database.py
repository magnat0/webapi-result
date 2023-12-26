from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base

SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///./sql_app.db"

async def get_db_session():
    engine = create_async_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )

    SessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)
    async with SessionLocal() as Session:
        yield Session

Base = declarative_base()