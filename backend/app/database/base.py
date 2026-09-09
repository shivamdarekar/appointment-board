from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Shared declarative base for all SQLAlchemy models.

    All models inherit from this class so that Base.metadata
    contains the complete schema used by Alembic autogenerate.
    """
    pass
