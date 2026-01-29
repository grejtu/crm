from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import get_settings

settings = get_settings()

# Handle different database backends
database_url = settings.DATABASE_URL
connect_args = {}

# SQLite needs check_same_thread=False
if database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
# PostgreSQL from Render uses postgres:// but SQLAlchemy needs postgresql://
elif database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(database_url, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
