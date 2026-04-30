import json
from pathlib import Path
from uuid import UUID

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models import NoteEdge


FIXTURES_DIR = Path(__file__).parent / "fixtures"


def _normalize_note_payload(payload: dict) -> dict:
    """Normalize export payload for stable round-trip comparisons."""
    out = dict(payload)
    out.pop("id", None)  # server-generated

    boxes = []
    for b in out.get("boxes", []) or []:
        b2 = dict(b)
        b2["id"] = int(b2.get("id"))
        style = dict(b2.get("style") or {})
        b2["style"] = {
            "left": style.get("left") or "0px",
            "top": style.get("top") or "20px",
            "backgroundColor": style.get("backgroundColor", None),
        }
        b2["lines"] = [str(x) for x in (b2.get("lines") or [])]
        b2["lines"].sort(key=lambda x: int(x) if str(x).isdigit() else str(x))
        boxes.append(b2)

    boxes.sort(key=lambda x: x["id"])
    out["boxes"] = boxes

    out["heading"] = out.get("heading") or ""
    out["cueText"] = out.get("cueText") or ""
    out["summary"] = out.get("summary") or ""
    return out


def test_health(client: TestClient) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_note_crud_roundtrip(client: TestClient) -> None:
    r = client.post("/notes", json={})
    assert r.status_code == 201
    doc = r.json()
    assert doc.get("id")
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
    assert out.get("id") == nid
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


def test_note_roundtrip_matches_frontend_export_fixtures(client: TestClient) -> None:
    fixture_paths = sorted(FIXTURES_DIR.glob("*.json"))
    assert fixture_paths, "No fixtures found; expected tests/fixtures/*.json"

    r = client.post("/notes", json={})
    assert r.status_code == 201
    nid = r.json()["id"]

    for path in fixture_paths:
        payload = json.loads(path.read_text(encoding="utf-8"))

        r = client.put(f"/notes/{nid}", json=payload)
        assert r.status_code == 200, (path.name, r.text)

        r = client.get(f"/notes/{nid}")
        assert r.status_code == 200, (path.name, r.text)
        exported = r.json()

        assert _normalize_note_payload(exported) == _normalize_note_payload(payload), path.name


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
