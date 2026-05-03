import json

import httpx
import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def _isolate_ai_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    """Tests must not call Gemini or read the developer's GEMINI_API_KEY from .env."""
    from app.config import settings

    monkeypatch.setattr(settings, "gemini_api_key", "")
    monkeypatch.setattr(settings, "ai_provider", "auto")


def _patch_gemini_response(monkeypatch: pytest.MonkeyPatch, payload_text: str) -> dict:
    """Stub httpx.Client so /ai/analyze never actually hits Gemini.

    Returns the captured request payload (set after the endpoint is called).
    """
    captured: dict = {}

    class FakeResp:
        status_code = 200

        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict:
            return {"candidates": [{"content": {"parts": [{"text": payload_text}]}}]}

    class PatchedClient(httpx.Client):
        def post(self, *args, **kwargs):
            captured["json"] = kwargs.get("json")
            captured["params"] = kwargs.get("params")
            return FakeResp()

    monkeypatch.setattr("app.ai_analyze.httpx.Client", PatchedClient)
    return captured


def test_ai_analyze_placeholder_accepts_cornell_shape(client: TestClient) -> None:
    body = {
        "heading": "Topic",
        "cueText": "Cue",
        "summary": "Summary area",
        "boxes": [
            {
                "id": 1,
                "content": "A",
                "style": {"left": "0px", "top": "20px", "backgroundColor": None},
                "lines": ["2"],
            },
            {
                "id": 2,
                "content": "B",
                "style": {"left": "10px", "top": "30px", "backgroundColor": "#eee"},
                "lines": ["1"],
            },
        ],
    }
    r = client.post("/ai/analyze", json=body)
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "placeholder"
    assert "message" in data
    assert data.get("analysis", "") == ""
    assert data["concepts"] == []
    assert data["suggested_links"] == []


def test_ai_analyze_gemini_forced_without_key_returns_error(
    client: TestClient, monkeypatch
) -> None:
    from app.config import settings

    monkeypatch.setattr(settings, "ai_provider", "gemini")
    monkeypatch.setattr(settings, "gemini_api_key", "")
    r = client.post(
        "/ai/analyze",
        json={"heading": "H", "cueText": "", "summary": "", "boxes": []},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "error"
    assert "GEMINI_API_KEY" in data["message"]


def test_ai_analyze_gemini_returns_structured_payload(
    client: TestClient, monkeypatch
) -> None:
    from app.config import settings

    monkeypatch.setattr(settings, "ai_provider", "gemini")
    monkeypatch.setattr(settings, "gemini_api_key", "test-key")
    monkeypatch.setattr(settings, "gemini_model", "gemini-2.5-flash")

    model_json = json.dumps(
        {
            "analysis": "- **One** insight\n- Another insight",
            "concepts": ["mitosis", "Mitosis", "  cell cycle  ", "", 42],
            "suggested_links": [
                {"a": 1, "b": 2},
                {"a": 2, "b": 1},  # duplicate after canonicalization
                {"a": 1, "b": 1},  # self-link, drop
                {"a": 1, "b": 99},  # unknown id, drop
                {"a": "x", "b": "y"},  # not ints, drop
            ],
        }
    )
    captured = _patch_gemini_response(monkeypatch, model_json)

    body = {
        "heading": "Cell Division",
        "cueText": "What are the phases?",
        "summary": "",
        "boxes": [
            {"id": 1, "content": "Prophase", "lines": []},
            {"id": 2, "content": "Metaphase", "lines": []},
        ],
    }
    r = client.post("/ai/analyze", json=body)
    assert r.status_code == 200
    data = r.json()

    assert data["status"] == "ok"
    assert "insight" in data["analysis"]
    assert data["concepts"] == ["mitosis", "cell cycle"]
    assert data["suggested_links"] == [{"a": 1, "b": 2}]

    gen = (captured["json"] or {}).get("generationConfig", {})
    assert gen.get("responseMimeType") == "application/json"
    assert "responseSchema" in gen


def test_ai_analyze_gemini_malformed_json_falls_back_to_text(
    client: TestClient, monkeypatch
) -> None:
    from app.config import settings

    monkeypatch.setattr(settings, "ai_provider", "gemini")
    monkeypatch.setattr(settings, "gemini_api_key", "test-key")

    _patch_gemini_response(monkeypatch, "not really JSON, just markdown bullets")

    r = client.post(
        "/ai/analyze",
        json={"heading": "X", "cueText": "", "summary": "", "boxes": []},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert "markdown bullets" in data["analysis"]
    assert data["concepts"] == []
    assert data["suggested_links"] == []


def test_ai_analyze_gemini_drops_links_when_no_boxes(client: TestClient, monkeypatch) -> None:
    from app.config import settings

    monkeypatch.setattr(settings, "ai_provider", "gemini")
    monkeypatch.setattr(settings, "gemini_api_key", "test-key")

    _patch_gemini_response(
        monkeypatch,
        json.dumps(
            {
                "analysis": "ok",
                "concepts": ["alpha"],
                "suggested_links": [{"a": 1, "b": 2}],
            }
        ),
    )

    r = client.post(
        "/ai/analyze",
        json={"heading": "X", "cueText": "", "summary": "", "boxes": []},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["analysis"] == "ok"
    assert data["concepts"] == ["alpha"]
    # No box ids in the request → suggested_links must be dropped server-side.
    assert data["suggested_links"] == []
