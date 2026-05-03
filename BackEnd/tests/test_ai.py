import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def _isolate_ai_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    """Tests must not call Gemini or read the developer's GEMINI_API_KEY from .env."""
    from app.config import settings

    monkeypatch.setattr(settings, "gemini_api_key", "")
    monkeypatch.setattr(settings, "ai_provider", "auto")


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


def test_ai_analyze_gemini_forced_without_key_returns_error(client: TestClient, monkeypatch) -> None:
    from app.config import settings

    monkeypatch.setattr(settings, "ai_provider", "gemini")
    monkeypatch.setattr(settings, "gemini_api_key", "")
    r = client.post("/ai/analyze", json={"heading": "H", "cueText": "", "summary": "", "boxes": []})
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "error"
    assert "GEMINI_API_KEY" in data["message"]


def test_ai_analyze_gemini_success_uses_http_mock(client: TestClient, monkeypatch) -> None:
    from app.config import settings

    monkeypatch.setattr(settings, "ai_provider", "gemini")
    monkeypatch.setattr(settings, "gemini_api_key", "test-key")
    monkeypatch.setattr(settings, "gemini_model", "gemini-2.0-flash")

    class FakeResp:
        status_code = 200

        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict:
            return {"candidates": [{"content": {"parts": [{"text": "- **One** insight"}]}}]}

    import httpx

    class PatchedClient(httpx.Client):
        def post(self, *a, **k):
            return FakeResp()

    monkeypatch.setattr("app.ai_analyze.httpx.Client", PatchedClient)

    r = client.post("/ai/analyze", json={"heading": "X", "cueText": "", "summary": "", "boxes": []})
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert "insight" in data["analysis"]
