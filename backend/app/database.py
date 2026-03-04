from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

# For MS SQL with pyodbc (synchronous SQLAlchemy for now)
from sqlalchemy import create_engine, Engine
from sqlalchemy.orm import sessionmaker, Session

# For async support with MS SQL, you might need to use asyncodbc
# engine = create_async_engine(
#     settings.database_url.replace("mssql+pyodbc", "mssql+asyncodbc"),
#     echo=settings.debug,
#     pool_pre_ping=True,
# )
# SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Using synchronous engine for simplicity
engine: Engine = create_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Session:
    """Dependency for getting database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
