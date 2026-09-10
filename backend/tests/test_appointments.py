"""
Appointment API tests — business logic and CRUD.

Covers:
- Create (happy path, defaults)
- UUID ID generation and path routing
- Overlap detection (all cases from the spec)
- Adjacent appointments allowed
- Different dates allowed
- Cancelled appointment does not block slot
- Completed appointment does not block slot (per project rule)
- Update (valid, self-conflict exclusion, conflict with other)
- Complete / cancel state transitions
- Invalid state transitions
- Filtering by date and status
- 404 for nonexistent UUIDs
"""

import uuid

import pytest

from tests.conftest import make_appointment_payload


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def create(client, **kwargs) -> dict:
    """POST /api/appointments and assert 201, returning the response body."""
    payload = make_appointment_payload(**kwargs)
    resp = client.post("/api/appointments", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


# ---------------------------------------------------------------------------
# Create — happy path
# ---------------------------------------------------------------------------

class TestCreate:
    def test_valid_create_returns_201(self, client):
        resp = client.post("/api/appointments", json=make_appointment_payload())
        assert resp.status_code == 201

    def test_response_contains_all_fields(self, client):
        resp = client.post("/api/appointments", json=make_appointment_payload())
        data = resp.json()
        for field in ("id", "title", "description", "appointment_date",
                      "start_time", "end_time", "status", "created_at", "updated_at"):
            assert field in data, f"missing field: {field}"

    def test_id_is_valid_uuid(self, client):
        data = create(client)
        parsed = uuid.UUID(data["id"])  # raises ValueError if not a valid UUID
        assert str(parsed) == data["id"]

    def test_default_status_is_scheduled(self, client):
        data = create(client)
        assert data["status"] == "scheduled"

    def test_description_defaults_to_null(self, client):
        data = create(client)
        assert data["description"] is None

    def test_description_persisted_when_provided(self, client):
        data = create(client, description="Bring slides")
        assert data["description"] == "Bring slides"

    def test_title_is_stripped(self, client):
        data = create(client, title="  Standup  ")
        assert data["title"] == "Standup"

    def test_persisted_values_match_input(self, client):
        data = create(
            client,
            title="Planning",
            appointment_date="2026-11-05",
            start_time="09:00:00",
            end_time="10:30:00",
        )
        assert data["title"] == "Planning"
        assert data["appointment_date"] == "2026-11-05"
        assert data["start_time"] == "09:00:00"
        assert data["end_time"] == "10:30:00"


# ---------------------------------------------------------------------------
# UUID routing
# ---------------------------------------------------------------------------

class TestUUIDRouting:
    def test_get_by_uuid(self, client):
        created = create(client)
        resp = client.get(f"/api/appointments/{created['id']}")
        assert resp.status_code == 200
        assert resp.json()["id"] == created["id"]

    def test_nonexistent_uuid_returns_404(self, client):
        fake_id = str(uuid.uuid4())
        resp = client.get(f"/api/appointments/{fake_id}")
        assert resp.status_code == 404

    def test_malformed_uuid_returns_422(self, client):
        resp = client.get("/api/appointments/not-a-uuid")
        assert resp.status_code == 422

    def test_update_by_uuid(self, client):
        created = create(client)
        resp = client.put(
            f"/api/appointments/{created['id']}",
            json={"title": "Updated"},
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated"

    def test_complete_by_uuid(self, client):
        created = create(client)
        resp = client.patch(f"/api/appointments/{created['id']}/complete")
        assert resp.status_code == 200

    def test_cancel_by_uuid(self, client):
        created = create(client)
        resp = client.patch(f"/api/appointments/{created['id']}/cancel")
        assert resp.status_code == 200

    def test_update_nonexistent_returns_404(self, client):
        resp = client.put(
            f"/api/appointments/{uuid.uuid4()}",
            json={"title": "Ghost"},
        )
        assert resp.status_code == 404

    def test_complete_nonexistent_returns_404(self, client):
        resp = client.patch(f"/api/appointments/{uuid.uuid4()}/complete")
        assert resp.status_code == 404

    def test_cancel_nonexistent_returns_404(self, client):
        resp = client.patch(f"/api/appointments/{uuid.uuid4()}/cancel")
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Overlap detection
# ---------------------------------------------------------------------------

DATE = "2026-10-15"


class TestOverlapDetection:
    def test_exact_overlap_rejected(self, client):
        create(client, appointment_date=DATE, start_time="10:00:00", end_time="11:00:00")
        resp = client.post("/api/appointments", json=make_appointment_payload(
            appointment_date=DATE, start_time="10:00:00", end_time="11:00:00"
        ))
        assert resp.status_code == 409

    def test_new_starts_inside_existing_rejected(self, client):
        create(client, appointment_date=DATE, start_time="10:00:00", end_time="11:00:00")
        resp = client.post("/api/appointments", json=make_appointment_payload(
            appointment_date=DATE, start_time="10:30:00", end_time="11:30:00"
        ))
        assert resp.status_code == 409

    def test_new_ends_inside_existing_rejected(self, client):
        create(client, appointment_date=DATE, start_time="10:00:00", end_time="12:00:00")
        resp = client.post("/api/appointments", json=make_appointment_payload(
            appointment_date=DATE, start_time="09:00:00", end_time="10:30:00"
        ))
        assert resp.status_code == 409

    def test_new_contains_existing_rejected(self, client):
        create(client, appointment_date=DATE, start_time="10:00:00", end_time="11:00:00")
        resp = client.post("/api/appointments", json=make_appointment_payload(
            appointment_date=DATE, start_time="09:00:00", end_time="12:00:00"
        ))
        assert resp.status_code == 409

    def test_existing_contains_new_rejected(self, client):
        create(client, appointment_date=DATE, start_time="09:00:00", end_time="12:00:00")
        resp = client.post("/api/appointments", json=make_appointment_payload(
            appointment_date=DATE, start_time="10:00:00", end_time="11:00:00"
        ))
        assert resp.status_code == 409

    def test_adjacent_appointments_allowed(self, client):
        """Half-open interval: end of one == start of next must be ALLOWED."""
        create(client, appointment_date=DATE, start_time="10:00:00", end_time="11:00:00")
        resp = client.post("/api/appointments", json=make_appointment_payload(
            appointment_date=DATE, start_time="11:00:00", end_time="12:00:00"
        ))
        assert resp.status_code == 201

    def test_completely_separate_allowed(self, client):
        create(client, appointment_date=DATE, start_time="10:00:00", end_time="11:00:00")
        resp = client.post("/api/appointments", json=make_appointment_payload(
            appointment_date=DATE, start_time="12:00:00", end_time="13:00:00"
        ))
        assert resp.status_code == 201

    def test_different_date_no_conflict(self, client):
        """Same time on a different date must NOT conflict."""
        create(client, appointment_date="2026-10-15", start_time="10:00:00", end_time="11:00:00")
        resp = client.post("/api/appointments", json=make_appointment_payload(
            appointment_date="2026-10-16", start_time="10:30:00", end_time="11:30:00"
        ))
        assert resp.status_code == 201


# ---------------------------------------------------------------------------
# Cancelled appointment does not block slot
# ---------------------------------------------------------------------------

class TestCancelledDoesNotBlock:
    def test_cancelled_slot_can_be_reused(self, client):
        """
        Cancelling an appointment must free its time slot.
        A new appointment overlapping that slot must be accepted.
        """
        created = create(client, appointment_date=DATE, start_time="10:00:00", end_time="11:00:00")

        # Cancel original
        cancel_resp = client.patch(f"/api/appointments/{created['id']}/cancel")
        assert cancel_resp.status_code == 200
        assert cancel_resp.json()["status"] == "cancelled"

        # Original record still exists
        get_resp = client.get(f"/api/appointments/{created['id']}")
        assert get_resp.status_code == 200
        assert get_resp.json()["status"] == "cancelled"

        # New appointment in the same slot must succeed
        new_resp = client.post("/api/appointments", json=make_appointment_payload(
            appointment_date=DATE, start_time="10:30:00", end_time="11:30:00"
        ))
        assert new_resp.status_code == 201


# ---------------------------------------------------------------------------
# Completed appointment does not block slot
# ---------------------------------------------------------------------------

class TestCompletedDoesNotBlock:
    def test_completed_slot_can_be_reused(self, client):
        """
        Per project rule: completed appointments do not block future scheduling.
        A new overlapping appointment on the same slot must be accepted.
        """
        created = create(client, appointment_date=DATE, start_time="10:00:00", end_time="11:00:00")

        # Complete original
        complete_resp = client.patch(f"/api/appointments/{created['id']}/complete")
        assert complete_resp.status_code == 200
        assert complete_resp.json()["status"] == "completed"

        # New appointment overlapping the completed one must succeed
        new_resp = client.post("/api/appointments", json=make_appointment_payload(
            appointment_date=DATE, start_time="10:00:00", end_time="11:00:00"
        ))
        assert new_resp.status_code == 201


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

class TestUpdate:
    def test_valid_update_returns_200(self, client):
        created = create(client)
        resp = client.put(
            f"/api/appointments/{created['id']}",
            json={"title": "New Title"},
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "New Title"

    def test_update_all_fields(self, client):
        created = create(client)
        resp = client.put(
            f"/api/appointments/{created['id']}",
            json={
                "title": "Full Update",
                "description": "Updated desc",
                "appointment_date": "2026-12-01",
                "start_time": "14:00:00",
                "end_time": "15:00:00",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Full Update"
        assert data["description"] == "Updated desc"
        assert data["appointment_date"] == "2026-12-01"
        assert data["start_time"] == "14:00:00"
        assert data["end_time"] == "15:00:00"

    def test_update_does_not_conflict_with_itself(self, client):
        """An appointment being updated must not conflict with its own current slot."""
        created = create(client, appointment_date=DATE, start_time="10:00:00", end_time="11:00:00")
        resp = client.put(
            f"/api/appointments/{created['id']}",
            json={"start_time": "10:15:00", "end_time": "10:45:00"},
        )
        assert resp.status_code == 200

    def test_update_into_another_appointments_slot_rejected(self, client):
        create(client, appointment_date=DATE, start_time="10:00:00", end_time="11:00:00")
        appt_b = create(client, appointment_date=DATE, start_time="12:00:00", end_time="13:00:00")

        resp = client.put(
            f"/api/appointments/{appt_b['id']}",
            json={"start_time": "10:30:00", "end_time": "11:30:00"},
        )
        assert resp.status_code == 409

    def test_update_get_reflects_changes(self, client):
        created = create(client)
        client.put(f"/api/appointments/{created['id']}", json={"title": "Persisted"})
        get_resp = client.get(f"/api/appointments/{created['id']}")
        assert get_resp.json()["title"] == "Persisted"


# ---------------------------------------------------------------------------
# Complete / Cancel state transitions
# ---------------------------------------------------------------------------

class TestStateTransitions:
    def test_complete_scheduled_appointment(self, client):
        created = create(client)
        resp = client.patch(f"/api/appointments/{created['id']}/complete")
        assert resp.status_code == 200
        assert resp.json()["status"] == "completed"

    def test_cancel_scheduled_appointment(self, client):
        created = create(client)
        resp = client.patch(f"/api/appointments/{created['id']}/cancel")
        assert resp.status_code == 200
        assert resp.json()["status"] == "cancelled"

    def test_cancel_does_not_delete_record(self, client):
        created = create(client)
        client.patch(f"/api/appointments/{created['id']}/cancel")
        resp = client.get(f"/api/appointments/{created['id']}")
        assert resp.status_code == 200
        assert resp.json()["status"] == "cancelled"

    def test_complete_already_completed_returns_409(self, client):
        created = create(client)
        client.patch(f"/api/appointments/{created['id']}/complete")
        resp = client.patch(f"/api/appointments/{created['id']}/complete")
        assert resp.status_code == 409

    def test_complete_cancelled_returns_409(self, client):
        created = create(client)
        client.patch(f"/api/appointments/{created['id']}/cancel")
        resp = client.patch(f"/api/appointments/{created['id']}/complete")
        assert resp.status_code == 409

    def test_cancel_already_cancelled_returns_409(self, client):
        created = create(client)
        client.patch(f"/api/appointments/{created['id']}/cancel")
        resp = client.patch(f"/api/appointments/{created['id']}/cancel")
        assert resp.status_code == 409

    def test_cancel_completed_returns_409(self, client):
        created = create(client)
        client.patch(f"/api/appointments/{created['id']}/complete")
        resp = client.patch(f"/api/appointments/{created['id']}/cancel")
        assert resp.status_code == 409

    def test_get_after_complete_shows_updated_status(self, client):
        created = create(client)
        client.patch(f"/api/appointments/{created['id']}/complete")
        resp = client.get(f"/api/appointments/{created['id']}")
        assert resp.json()["status"] == "completed"

    def test_get_after_cancel_shows_updated_status(self, client):
        created = create(client)
        client.patch(f"/api/appointments/{created['id']}/cancel")
        resp = client.get(f"/api/appointments/{created['id']}")
        assert resp.json()["status"] == "cancelled"

    def test_edit_completed_appointment_returns_409(self, client):
        created = create(client)
        client.patch(f"/api/appointments/{created['id']}/complete")
        resp = client.put(
            f"/api/appointments/{created['id']}",
            json={"title": "Attempting edit"},
        )
        assert resp.status_code == 409

    def test_edit_cancelled_appointment_returns_409(self, client):
        created = create(client)
        client.patch(f"/api/appointments/{created['id']}/cancel")
        resp = client.put(
            f"/api/appointments/{created['id']}",
            json={"title": "Attempting edit"},
        )
        assert resp.status_code == 409


# ---------------------------------------------------------------------------
# Filtering
# ---------------------------------------------------------------------------

class TestFiltering:
    def test_filter_by_date_returns_only_matching(self, client):
        create(client, appointment_date="2026-10-01", start_time="09:00:00", end_time="10:00:00")
        create(client, appointment_date="2026-10-02", start_time="09:00:00", end_time="10:00:00")

        resp = client.get("/api/appointments?date=2026-10-01")
        assert resp.status_code == 200
        results = resp.json()["items"]
        assert len(results) == 1
        assert results[0]["appointment_date"] == "2026-10-01"

    def test_filter_by_date_no_match_returns_empty(self, client):
        create(client, appointment_date="2026-10-01", start_time="09:00:00", end_time="10:00:00")
        resp = client.get("/api/appointments?date=2026-12-31")
        assert resp.status_code == 200
        assert resp.json()["items"] == []

    def test_filter_by_status_scheduled(self, client):
        a = create(client, appointment_date="2026-10-01", start_time="09:00:00", end_time="10:00:00")
        b = create(client, appointment_date="2026-10-01", start_time="11:00:00", end_time="12:00:00")
        client.patch(f"/api/appointments/{b['id']}/cancel")

        resp = client.get("/api/appointments?status=scheduled")
        assert resp.status_code == 200
        ids = [r["id"] for r in resp.json()["items"]]
        assert a["id"] in ids
        assert b["id"] not in ids

    def test_filter_by_status_cancelled(self, client):
        a = create(client, appointment_date="2026-10-01", start_time="09:00:00", end_time="10:00:00")
        b = create(client, appointment_date="2026-10-01", start_time="11:00:00", end_time="12:00:00")
        client.patch(f"/api/appointments/{b['id']}/cancel")

        resp = client.get("/api/appointments?status=cancelled")
        assert resp.status_code == 200
        ids = [r["id"] for r in resp.json()["items"]]
        assert b["id"] in ids
        assert a["id"] not in ids

    def test_filter_combined_date_and_status(self, client):
        # Scheduled on target date
        a = create(client, appointment_date="2026-10-01", start_time="09:00:00", end_time="10:00:00")
        # Cancelled on target date
        b = create(client, appointment_date="2026-10-01", start_time="11:00:00", end_time="12:00:00")
        client.patch(f"/api/appointments/{b['id']}/cancel")
        # Scheduled on different date
        create(client, appointment_date="2026-10-02", start_time="09:00:00", end_time="10:00:00")

        resp = client.get("/api/appointments?date=2026-10-01&status=scheduled")
        assert resp.status_code == 200
        results = resp.json()["items"]
        ids = [r["id"] for r in results]
        assert a["id"] in ids
        assert b["id"] not in ids
        assert all(r["appointment_date"] == "2026-10-01" for r in results)

    def test_invalid_status_filter_returns_422(self, client):
        resp = client.get("/api/appointments?status=unknown")
        assert resp.status_code == 422

    def test_no_filter_returns_all(self, client):
        create(client, appointment_date="2026-10-01", start_time="09:00:00", end_time="10:00:00")
        create(client, appointment_date="2026-10-02", start_time="09:00:00", end_time="10:00:00")
        resp = client.get("/api/appointments")
        assert resp.status_code == 200
        assert resp.json()["total"] == 2

    def test_results_ordered_by_date_then_time(self, client):
        create(client, appointment_date="2026-10-02", start_time="09:00:00", end_time="10:00:00", title="B")
        create(client, appointment_date="2026-10-01", start_time="14:00:00", end_time="15:00:00", title="C")
        create(client, appointment_date="2026-10-01", start_time="09:00:00", end_time="10:00:00", title="A")

        resp = client.get("/api/appointments")
        titles = [r["title"] for r in resp.json()["items"]]
        assert titles == ["A", "C", "B"]
