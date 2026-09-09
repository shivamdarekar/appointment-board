"""
Test configuration and shared fixtures.

Database isolation strategy
----------------------------
Tests use a temporary file-based SQLite database rather than the real Neon
PostgreSQL instance.  A new database file is created for each test function
and deleted afterwards, giving full isolation.

Why not in-memory (sqlite://)?
SQLite's :memory: database is scoped to a single connection.  FastAPI's
TestClient runs route handlers in a worker thread, which gets its own
connection — different from the one the fixture used to CREATE TABLE.
Result: "no such table".  A temp file is visible to all connections and
solves this cleanly without any connection-sharing gymnastics.

SQLite compatibility note
--------------------------
The Appointment model uses SQLAlchemy's generic `Uuid` type (not the
postgresql-dialect-specific UUID).  The generic type maps to CHAR(32) on
SQLite and to the native uuid type on PostgreSQL, so the same model class
works for both environments without any patching.
"""

import os
import tempfile

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app.database.base import Base
from app.database.connection import get_db
from app.main import app


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="function")
def db_engine():
    """Create a temporary SQLite database file for one test, then remove it."""
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)

    engine = create_engine(
        f"sqlite:///{path}",
        connect_args={"check_same_thread": False},
    )

    # Enable CHECK constraints so the end_time > start_time db-level guard
    # is exercised in tests too.
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, _record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    os.unlink(path)


@pytest.fixture(scope="function")
def db_session(db_engine):
    """Provide a SQLAlchemy session bound to the test database."""
    TestingSessionLocal = sessionmaker(
        bind=db_engine,
        autocommit=False,
        autoflush=False,
    )
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def client(db_engine):
    """Return a FastAPI TestClient wired to the isolated SQLite database.

    Each request the client makes gets its own session from the same
    test engine — so the tables created by db_engine are always visible.
    """
    TestingSessionLocal = sessionmaker(
        bind=db_engine,
        autocommit=False,
        autoflush=False,
    )

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Helper factories
# ---------------------------------------------------------------------------

def make_appointment_payload(
    title: str = "Team Sync",
    appointment_date: str = "2026-10-01",
    start_time: str = "10:00:00",
    end_time: str = "11:00:00",
    description: str | None = None,
) -> dict:
    """Return a valid appointment creation payload dict."""
    payload: dict = {
        "title": title,
        "appointment_date": appointment_date,
        "start_time": start_time,
        "end_time": end_time,
    }
    if description is not None:
        payload["description"] = description
    return payload
