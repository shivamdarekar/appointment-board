"""
Input validation tests.

Covers schema-level and service-level validation:
- Missing required fields → 422
- Empty / whitespace-only title → 422
- Title exceeding max length → 422
- end_time <= start_time → 422
- Invalid date format → 422
- Invalid time format → 422
- Invalid status filter → 422
- Malformed UUID path → 422
- Description optional
- Update with invalid time ordering → 422
"""

import pytest

from tests.conftest import make_appointment_payload


def post(client, payload: dict):
    return client.post("/api/appointments", json=payload)


# ---------------------------------------------------------------------------
# Missing required fields
# ---------------------------------------------------------------------------

class TestMissingFields:
    def test_missing_title(self, client):
        payload = make_appointment_payload()
        del payload["title"]
        assert post(client, payload).status_code == 422

    def test_missing_appointment_date(self, client):
        payload = make_appointment_payload()
        del payload["appointment_date"]
        assert post(client, payload).status_code == 422

    def test_missing_start_time(self, client):
        payload = make_appointment_payload()
        del payload["start_time"]
        assert post(client, payload).status_code == 422

    def test_missing_end_time(self, client):
        payload = make_appointment_payload()
        del payload["end_time"]
        assert post(client, payload).status_code == 422


# ---------------------------------------------------------------------------
# Title validation
# ---------------------------------------------------------------------------

class TestTitleValidation:
    def test_empty_string_title_rejected(self, client):
        payload = make_appointment_payload(title="")
        assert post(client, payload).status_code == 422

    def test_whitespace_only_title_rejected(self, client):
        payload = make_appointment_payload(title="   ")
        assert post(client, payload).status_code == 422

    def test_title_at_max_length_accepted(self, client):
        payload = make_appointment_payload(title="A" * 255)
        assert post(client, payload).status_code == 201

    def test_title_exceeding_max_length_rejected(self, client):
        payload = make_appointment_payload(title="A" * 256)
        assert post(client, payload).status_code == 422

    def test_title_is_stripped_in_response(self, client):
        payload = make_appointment_payload(title="  Standup  ")
        resp = post(client, payload)
        assert resp.status_code == 201
        assert resp.json()["title"] == "Standup"


# ---------------------------------------------------------------------------
# Time range validation
# ---------------------------------------------------------------------------

class TestTimeRangeValidation:
    def test_end_before_start_rejected(self, client):
        payload = make_appointment_payload(start_time="15:00:00", end_time="14:00:00")
        assert post(client, payload).status_code == 422

    def test_end_equal_to_start_rejected(self, client):
        payload = make_appointment_payload(start_time="15:00:00", end_time="15:00:00")
        assert post(client, payload).status_code == 422

    def test_valid_time_range_accepted(self, client):
        payload = make_appointment_payload(start_time="09:00:00", end_time="09:30:00")
        assert post(client, payload).status_code == 201


# ---------------------------------------------------------------------------
# Invalid formats
# ---------------------------------------------------------------------------

class TestInvalidFormats:
    def test_invalid_date_format_rejected(self, client):
        payload = make_appointment_payload(appointment_date="not-a-date")
        assert post(client, payload).status_code == 422

    def test_invalid_time_format_rejected(self, client):
        payload = make_appointment_payload(start_time="25:99:00")
        assert post(client, payload).status_code == 422

    def test_malformed_uuid_in_path_rejected(self, client):
        resp = client.get("/api/appointments/not-a-valid-uuid")
        assert resp.status_code == 422

    def test_invalid_status_query_param_rejected(self, client):
        resp = client.get("/api/appointments?status=pending")
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Description field
# ---------------------------------------------------------------------------

class TestDescriptionField:
    def test_description_omitted_defaults_to_null(self, client):
        payload = make_appointment_payload()
        resp = post(client, payload)
        assert resp.status_code == 201
        assert resp.json()["description"] is None

    def test_description_null_explicitly(self, client):
        payload = make_appointment_payload()
        payload["description"] = None
        resp = post(client, payload)
        assert resp.status_code == 201
        assert resp.json()["description"] is None

    def test_description_string_persisted(self, client):
        payload = make_appointment_payload(description="Room 3B")
        resp = post(client, payload)
        assert resp.status_code == 201
        assert resp.json()["description"] == "Room 3B"


# ---------------------------------------------------------------------------
# Update validation
# ---------------------------------------------------------------------------

class TestUpdateValidation:
    def _create(self, client) -> str:
        payload = make_appointment_payload()
        return client.post("/api/appointments", json=payload).json()["id"]

    def test_update_end_before_start_rejected(self, client):
        appt_id = self._create(client)
        resp = client.put(
            f"/api/appointments/{appt_id}",
            json={"start_time": "15:00:00", "end_time": "14:00:00"},
        )
        assert resp.status_code == 422

    def test_update_end_equal_start_rejected(self, client):
        appt_id = self._create(client)
        resp = client.put(
            f"/api/appointments/{appt_id}",
            json={"start_time": "10:00:00", "end_time": "10:00:00"},
        )
        assert resp.status_code == 422

    def test_update_empty_title_rejected(self, client):
        appt_id = self._create(client)
        resp = client.put(
            f"/api/appointments/{appt_id}",
            json={"title": "   "},
        )
        assert resp.status_code == 422

    def test_update_title_too_long_rejected(self, client):
        appt_id = self._create(client)
        resp = client.put(
            f"/api/appointments/{appt_id}",
            json={"title": "X" * 256},
        )
        assert resp.status_code == 422
