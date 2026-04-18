from uuid import UUID

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models import NoteEdge


def test_health(client: TestClient) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_note_crud_roundtrip(client: TestClient) -> None:
    r = client.post("/notes", json={})
    assert r.status_code == 201
    doc = r.json()
    assert doc["heading"] == ""
    assert doc["boxes"] == []
    r = client.get("/notes")
    assert r.status_code == 200
    rows = r.json()
    assert len(rows) == 1
    nid = rows[0]["id"]

    payload = {
        "heading": "H",
        "cueText": "C",
        "summary": "S",
        "boxes": [
            {
                "id": 1,
                "content": "A",
                "style": {"left": "10px", "top": "20px", "backgroundColor": "#fff"},
                "lines": ["2"],
            },
            {
                "id": 2,
                "content": "B",
                "style": {"left": "30px", "top": "40px", "backgroundColor": None},
                "lines": ["1"],
            },
        ],
    }
    r = client.put(f"/notes/{nid}", json=payload)
    assert r.status_code == 200
    out = r.json()
    assert out["heading"] == "H"
    assert len(out["boxes"]) == 2
    ids = {b["id"] for b in out["boxes"]}
    assert ids == {1, 2}
    b1 = next(b for b in out["boxes"] if b["id"] == 1)
    assert set(b1["lines"]) == {"2"}

    r = client.delete(f"/notes/{nid}")
    assert r.status_code == 204
    r = client.get(f"/notes/{nid}")
    assert r.status_code == 404


def test_get_note_skips_orphan_edges(client: TestClient, engine) -> None:
    """Edges pointing at missing local_ids must not crash document reconstruction."""
    r = client.post(
        "/notes",
        json={"boxes": [{"id": 1, "content": "only", "style": {}, "lines": []}]},
    )
    assert r.status_code == 201
    nid = UUID(client.get("/notes").json()[0]["id"])

    with Session(engine) as session:
        session.add(NoteEdge(note_id=nid, n1=1, n2=99))
        session.commit()

    r = client.get(f"/notes/{nid}")
    assert r.status_code == 200
    assert r.json()["boxes"][0]["lines"] == []
