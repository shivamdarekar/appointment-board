"""
Pagination tests for GET /api/appointments.

Covers:
- Basic paginated response shape
- Default page/page_size values
- page_size parameter
- Multiple pages (total, total_pages, items per page)
- Empty database (total=0, total_pages=0)
- Filters combined with pagination
- Out-of-range page returns empty items without 500
- Invalid query params (page=0, page=-1, page_size=0) return 422
- page_size exceeding max (>100) returns 422
- Stable ordering across pages
"""

import pytest

from tests.conftest import make_appointment_payload


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def create(client, **kwargs) -> dict:
    payload = make_appointment_payload(**kwargs)
    resp = client.post("/api/appointments", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


def list_page(client, **params) -> dict:
    resp = client.get("/api/appointments", params=params)
    assert resp.status_code == 200, resp.text
    return resp.json()


# ---------------------------------------------------------------------------
# Response shape
# ---------------------------------------------------------------------------

class TestResponseShape:
    def test_empty_db_returns_paginated_shape(self, client):
        data = list_page(client)
        assert "items" in data
        assert "page" in data
        assert "page_size" in data
        assert "total" in data
        assert "total_pages" in data

    def test_empty_db_zero_total(self, client):
        data = list_page(client)
        assert data["total"] == 0
        assert data["total_pages"] == 0
        assert data["items"] == []

    def test_default_page_and_page_size(self, client):
        data = list_page(client)
        assert data["page"] == 1
        assert data["page_size"] == 10

    def test_items_are_appointment_objects(self, client):
        create(client)
        data = list_page(client)
        assert len(data["items"]) == 1
        item = data["items"][0]
        for field in ("id", "title", "appointment_date", "start_time", "end_time", "status"):
            assert field in item


# ---------------------------------------------------------------------------
# Pagination arithmetic
# ---------------------------------------------------------------------------

class TestPaginationArithmetic:
    def _create_n(self, client, n: int):
        """Create n appointments with distinct non-conflicting time slots."""
        for i in range(n):
            hour = 8 + i  # 08:00, 09:00, … (up to n=12 before overflow)
            create(
                client,
                title=f"Appointment {i}",
                start_time=f"{hour:02d}:00:00",
                end_time=f"{hour:02d}:30:00",
            )

    def test_total_reflects_all_records(self, client):
        self._create_n(client, 5)
        data = list_page(client)
        assert data["total"] == 5

    def test_total_pages_rounded_up(self, client):
        self._create_n(client, 11)
        data = list_page(client, page_size=5)
        # 11 items / 5 per page = 3 pages
        assert data["total_pages"] == 3
        assert data["total"] == 11

    def test_total_pages_exact_division(self, client):
        self._create_n(client, 10)
        data = list_page(client, page_size=5)
        assert data["total_pages"] == 2

    def test_first_page_contains_page_size_items(self, client):
        self._create_n(client, 12)
        data = list_page(client, page=1, page_size=5)
        assert len(data["items"]) == 5
        assert data["page"] == 1

    def test_last_page_contains_remainder(self, client):
        self._create_n(client, 12)
        # 12 items, page_size=5 → pages: 5, 5, 2
        data = list_page(client, page=3, page_size=5)
        assert len(data["items"]) == 2

    def test_second_page_items_differ_from_first(self, client):
        self._create_n(client, 6)
        page1 = list_page(client, page=1, page_size=3)
        page2 = list_page(client, page=2, page_size=3)
        ids1 = {item["id"] for item in page1["items"]}
        ids2 = {item["id"] for item in page2["items"]}
        assert ids1.isdisjoint(ids2), "Pages must not contain the same appointments"

    def test_out_of_range_page_returns_empty_items_not_500(self, client):
        self._create_n(client, 3)
        data = list_page(client, page=999, page_size=10)
        assert data["items"] == []
        assert data["total"] == 3
        assert data["total_pages"] == 1
        assert data["page"] == 999


# ---------------------------------------------------------------------------
# Stable ordering
# ---------------------------------------------------------------------------

class TestOrdering:
    def test_ordering_is_by_date_then_start_time(self, client):
        create(client, title="Late",  appointment_date="2026-10-02", start_time="14:00:00", end_time="15:00:00")
        create(client, title="Early", appointment_date="2026-10-01", start_time="09:00:00", end_time="10:00:00")
        create(client, title="Mid",   appointment_date="2026-10-01", start_time="11:00:00", end_time="12:00:00")

        data = list_page(client, page_size=10)
        titles = [item["title"] for item in data["items"]]
        assert titles == ["Early", "Mid", "Late"]

    def test_ordering_is_stable_across_pages(self, client):
        for i in range(6):
            hour = 8 + i
            create(client, title=f"Appt {i}", start_time=f"{hour:02d}:00:00", end_time=f"{hour:02d}:30:00")

        page1 = list_page(client, page=1, page_size=3)
        page2 = list_page(client, page=2, page_size=3)

        all_ids = [item["id"] for item in page1["items"]] + [item["id"] for item in page2["items"]]
        full = list_page(client, page=1, page_size=10)
        full_ids = [item["id"] for item in full["items"]]

        assert all_ids == full_ids, "Paginated pages must produce the same order as a single full request"


# ---------------------------------------------------------------------------
# Filters + pagination
# ---------------------------------------------------------------------------

class TestFiltersWithPagination:
    def test_status_filter_with_pagination(self, client):
        # Create 3 scheduled and cancel 1
        ids = []
        for i in range(3):
            hour = 9 + i
            a = create(client, title=f"S{i}", start_time=f"{hour:02d}:00:00", end_time=f"{hour:02d}:30:00")
            ids.append(a["id"])

        client.patch(f"/api/appointments/{ids[0]}/cancel")

        data = list_page(client, status="scheduled", page=1, page_size=10)
        assert data["total"] == 2
        for item in data["items"]:
            assert item["status"] == "scheduled"

    def test_date_filter_with_pagination(self, client):
        create(client, title="Today",     appointment_date="2026-10-01", start_time="09:00:00", end_time="10:00:00")
        create(client, title="Tomorrow",  appointment_date="2026-10-02", start_time="09:00:00", end_time="10:00:00")
        create(client, title="Today too", appointment_date="2026-10-01", start_time="11:00:00", end_time="12:00:00")

        data = list_page(client, date="2026-10-01", page=1, page_size=10)
        assert data["total"] == 2
        assert all(item["appointment_date"] == "2026-10-01" for item in data["items"])

    def test_combined_filters_with_pagination(self, client):
        a = create(client, title="Sched today",   appointment_date="2026-10-01", start_time="09:00:00", end_time="10:00:00")
        b = create(client, title="Sched tomorrow", appointment_date="2026-10-02", start_time="09:00:00", end_time="10:00:00")
        create(client, title="Done today",         appointment_date="2026-10-01", start_time="11:00:00", end_time="12:00:00")
        client.patch(f"/api/appointments/{b['id']}/complete")

        # Mark "Done today" as complete
        all_appts = list_page(client, page=1, page_size=10)
        done_id = next(i["id"] for i in all_appts["items"] if i["title"] == "Done today")
        client.patch(f"/api/appointments/{done_id}/complete")

        data = list_page(client, date="2026-10-01", status="scheduled", page=1, page_size=10)
        assert data["total"] == 1
        assert data["items"][0]["title"] == "Sched today"

    def test_filter_paginates_filtered_total(self, client):
        for i in range(6):
            hour = 8 + i
            create(client, title=f"A{i}", start_time=f"{hour:02d}:00:00", end_time=f"{hour:02d}:30:00")

        # Cancel 2
        all_appts = list_page(client, page=1, page_size=10)
        for item in all_appts["items"][:2]:
            client.patch(f"/api/appointments/{item['id']}/cancel")

        data = list_page(client, status="scheduled", page=1, page_size=3)
        assert data["total"] == 4
        assert data["total_pages"] == 2


# ---------------------------------------------------------------------------
# Invalid query parameters
# ---------------------------------------------------------------------------

class TestInvalidParams:
    def test_page_zero_returns_422(self, client):
        resp = client.get("/api/appointments", params={"page": 0})
        assert resp.status_code == 422

    def test_page_negative_returns_422(self, client):
        resp = client.get("/api/appointments", params={"page": -1})
        assert resp.status_code == 422

    def test_page_size_zero_returns_422(self, client):
        resp = client.get("/api/appointments", params={"page_size": 0})
        assert resp.status_code == 422

    def test_page_size_over_max_returns_422(self, client):
        resp = client.get("/api/appointments", params={"page_size": 101})
        assert resp.status_code == 422

    def test_page_size_at_max_is_accepted(self, client):
        resp = client.get("/api/appointments", params={"page_size": 100})
        assert resp.status_code == 200
