from fastapi.testclient import TestClient


def test_links_crud(client: TestClient) -> None:
    r = client.post("/notes", json={"heading": "Links"})
    assert r.status_code == 201
    note_id = r.json()["id"]

    r = client.get(f"/links/list?note_id={note_id}")
    assert r.status_code == 200
    assert r.json() == []

    r = client.post("/links/create", json={"note_id": note_id, "a": 2, "b": 1})
    assert r.status_code == 201
    assert r.json()["a"] == 1
    assert r.json()["b"] == 2

    r = client.post("/links/create", json={"note_id": note_id, "a": 1, "b": 2})
    assert r.status_code == 201

    r = client.get(f"/links/list?note_id={note_id}")
    assert r.status_code == 200
    assert r.json() == [{"note_id": note_id, "a": 1, "b": 2}]

    r = client.post("/links/delete", json={"note_id": note_id, "a": 1, "b": 2})
    assert r.status_code == 204

    r = client.get(f"/links/list?note_id={note_id}")
    assert r.status_code == 200
    assert r.json() == []


def test_links_require_existing_note(client: TestClient) -> None:
    fake_note_id = "00000000-0000-0000-0000-000000000000"
    r = client.get(f"/links/list?note_id={fake_note_id}")
    assert r.status_code == 404
    r = client.post("/links/create", json={"note_id": fake_note_id, "a": 1, "b": 2})
    assert r.status_code == 404

