import json

import httpx
import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def _isolate_ai_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    """Tests must not call Gemini or read the developer's GEMINI_API_KEY from .env."""
    from app.config import settings

    monkeypatch.setattr(settings, "gemini_api_key", "")
    monkeypatch.setattr(settings, "openai_api_key", "")
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


def _patch_openai_response(monkeypatch: pytest.MonkeyPatch, payload_text: str) -> dict:
    captured: dict = {}

    class FakeResp:
        status_code = 200

        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict:
            return {"output_text": payload_text}

    class PatchedClient(httpx.Client):
        def post(self, *args, **kwargs):
            captured["json"] = kwargs.get("json")
            captured["headers"] = kwargs.get("headers")
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
    assert "Gemini API key" in data["message"]


def test_ai_analyze_gemini_returns_structured_payload(
    client: TestClient, monkeypatch
) -> None:
    from app.config import settings

    monkeypatch.setattr(settings, "ai_provider", "gemini")
    monkeypatch.setattr(settings, "gemini_api_key", "test-key")
    monkeypatch.setattr(settings, "gemini_model", "gemini-2.5-flash")

    model_json = json.dumps(
        {
            "overview": ["**One** insight", "Another insight"],
            "study_analysis": {
                "strengths": ["Clear phase sequence"],
                "weaknesses": ["Missing cytokinesis detail"],
                "opportunities": ["Connect phases to exam diagrams"],
                "threats": ["Confusing prophase with metaphase"],
                "recommended_improvements": ["Add a comparison table"],
            },
            "concepts": ["mitosis", "Mitosis", "  cell cycle  ", "", 42],
            "suggested_links": [
                {"a": 1, "b": 2},
                {"a": 2, "b": 1},  # duplicate after canonicalization
                {"a": 1, "b": 1},  # self-link, drop
                {"a": 1, "b": 99},  # unknown id, drop
                {"a": "x", "b": "y"},  # not ints, drop
            ],
            "see_also": [
                {"favicon": "K", "title": "Khan Academy: Mitosis", "url": "https://www.khanacademy.org/science/biology/cellular-molecular-biology/mitosis/a/phases-of-mitosis"},
                {"title": "", "url": "https://example.com/empty-title"},
                {"title": "Bad URL", "url": "notaurl"},
            ],
            "videos": [
                {"title": "Mitosis video", "url": "https://www.youtube.com/watch?v=f-ldPgEfAHI"},
                {"title": "Non-video", "url": "https://example.com/video"},
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
    assert data["overview"] == ["**One** insight", "Another insight"]
    assert data["study_analysis"] == {
        "strengths": ["Clear phase sequence"],
        "weaknesses": ["Missing cytokinesis detail"],
        "opportunities": ["Connect phases to exam diagrams"],
        "threats": ["Confusing prophase with metaphase"],
        "recommended_improvements": ["Add a comparison table"],
    }
    assert "insight" in data["analysis"]
    assert data["concepts"] == ["mitosis", "cell cycle"]
    assert data["suggested_links"] == [
        {"a": 1, "a_content": "Prophase", "b": 2, "b_content": "Metaphase"}
    ]
    assert data["see_also"] == [
        {
            "favicon": "K",
            "title": "Khan Academy: Mitosis",
            "url": "https://www.khanacademy.org/science/biology/cellular-molecular-biology/mitosis/a/phases-of-mitosis",
        }
    ]
    assert data["videos"] == [
        {
            "thumbnail": "https://i.ytimg.com/vi/f-ldPgEfAHI/hqdefault.jpg",
            "title": "Mitosis video",
            "channel": "",
            "url": "https://www.youtube.com/watch?v=f-ldPgEfAHI",
        }
    ]

    gen = (captured["json"] or {}).get("generationConfig", {})
    assert gen.get("responseMimeType") == "application/json"
    assert "responseSchema" in gen
    assert "tools" not in (captured["json"] or {})


def test_ai_analyze_uses_request_scoped_gemini_key(
    client: TestClient, monkeypatch
) -> None:
    from app.config import settings

    monkeypatch.setattr(settings, "ai_provider", "placeholder")
    monkeypatch.setattr(settings, "gemini_api_key", "")

    model_json = json.dumps(
        {
            "overview": ["Request key works"],
            "study_analysis": {
                "strengths": [],
                "weaknesses": [],
                "opportunities": [],
                "threats": [],
                "recommended_improvements": [],
            },
            "concepts": [],
            "suggested_links": [],
            "see_also": [],
            "videos": [],
        }
    )
    captured = _patch_gemini_response(monkeypatch, model_json)

    r = client.post(
        "/ai/analyze",
        json={
            "heading": "H",
            "cueText": "",
            "summary": "",
            "boxes": [],
            "llm_provider": "gemini",
            "gemini_api_key": "request-key",
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["overview"] == ["Request key works"]
    assert captured["params"] == {"key": "request-key"}


def test_ai_analyze_gemini_malformed_json_falls_back_to_text(
    client: TestClient, monkeypatch
) -> None:
    from app.config import settings

    monkeypatch.setattr(settings, "ai_provider", "gemini")
    monkeypatch.setattr(settings, "gemini_api_key", "test-key")

    _patch_gemini_response(monkeypatch, "not really JSON, just markdown bullets")

    r = client.post(
        "/ai/analyze",
        json={
            "heading": "Chess",
            "cueText": "Openings",
            "summary": "Study e4 and d4 plans.",
            "boxes": [{"id": 1, "content": "e4 controls the centre", "lines": []}],
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["overview"]
    assert data["study_analysis"]["recommended_improvements"]
    assert "not really JSON" not in data["analysis"]
    assert data["concepts"]
    assert data["suggested_links"] == []


def test_ai_analyze_malformed_json_like_text_does_not_return_raw_json(
    client: TestClient, monkeypatch
) -> None:
    from app.config import settings

    monkeypatch.setattr(settings, "ai_provider", "gemini")
    monkeypatch.setattr(settings, "gemini_api_key", "test-key")

    _patch_gemini_response(monkeypatch, '{"overview": ["unterminated"')

    r = client.post(
        "/ai/analyze",
        json={"heading": "X", "cueText": "", "summary": "", "boxes": []},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["overview"]
    assert data["study_analysis"]["recommended_improvements"]
    assert not data["analysis"].lstrip().startswith("{")


def test_ai_analyze_extracts_json_from_fenced_model_text(
    client: TestClient, monkeypatch
) -> None:
    from app.config import settings

    monkeypatch.setattr(settings, "ai_provider", "gemini")
    monkeypatch.setattr(settings, "gemini_api_key", "test-key")

    model_json = json.dumps(
        {
            "overview": ["Chess openings are grouped by first move."],
            "study_analysis": {
                "strengths": ["Clear opening examples"],
                "weaknesses": [],
                "opportunities": [],
                "threats": [],
                "recommended_improvements": ["Add common continuations"],
            },
            "concepts": ["e4", "Queen's Gambit"],
            "suggested_links": [],
            "see_also": [],
            "videos": [],
        }
    )
    _patch_gemini_response(monkeypatch, f"```json\n{model_json}\n```")

    r = client.post(
        "/ai/analyze",
        json={"heading": "Chess", "cueText": "", "summary": "", "boxes": []},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["overview"] == ["Chess openings are grouped by first move."]
    assert data["study_analysis"]["recommended_improvements"] == [
        "Add common continuations"
    ]
    assert data["concepts"] == ["e4", "Queen's Gambit"]
    assert not data["analysis"].lstrip().startswith("{")


def test_ai_analyze_gemini_drops_links_when_no_boxes(client: TestClient, monkeypatch) -> None:
    from app.config import settings

    monkeypatch.setattr(settings, "ai_provider", "gemini")
    monkeypatch.setattr(settings, "gemini_api_key", "test-key")

    _patch_gemini_response(
        monkeypatch,
        json.dumps(
            {
                "overview": ["ok"],
                "study_analysis": {
                    "strengths": ["useful"],
                    "weaknesses": [],
                    "opportunities": [],
                    "threats": [],
                    "recommended_improvements": ["next"],
                },
                "concepts": ["alpha"],
                "suggested_links": [{"a": 1, "b": 2}],
                "see_also": [],
                "videos": [],
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
    assert data["overview"] == ["ok"]
    assert data["analysis"] == (
        "Overview:\n- ok\n\nAnalysis:\nStrengths:\n- useful"
        "\n\nRecommended improvements:\n- next"
    )
    assert data["concepts"] == ["alpha"]
    # No box ids in the request → suggested_links must be dropped server-side.
    assert data["suggested_links"] == []


def test_ai_analyze_openai_uses_structured_outputs_and_request_model(
    client: TestClient, monkeypatch
) -> None:
    from app.config import settings

    monkeypatch.setattr(settings, "ai_provider", "placeholder")
    monkeypatch.setattr(settings, "openai_api_key", "test-openai-key")

    captured = _patch_openai_response(
        monkeypatch,
        json.dumps(
            {
                "overview": ["OpenAI works"],
                "study_analysis": {
                    "strengths": [],
                    "weaknesses": [],
                    "opportunities": [],
                    "threats": [],
                    "recommended_improvements": [],
                },
                "concepts": [],
                "suggested_links": [],
                "see_also": [],
                "videos": [],
            }
        ),
    )

    r = client.post(
        "/ai/analyze",
        json={
            "heading": "X",
            "cueText": "",
            "summary": "",
            "llm_provider": "openai",
            "llm_model": "gpt-5-mini",
            "pro_mode": True,
            "boxes": [],
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["overview"] == ["OpenAI works"]

    payload = captured["json"]
    assert payload["model"] == "gpt-5-mini"
    assert payload["text"]["format"]["type"] == "json_schema"
    assert payload["text"]["format"]["strict"] is True
    assert "OPENAI_API_KEY" not in json.dumps(payload)


def test_ai_coach_placeholder_returns_local_puzzles(client: TestClient) -> None:
    r = client.post(
        "/ai/coach",
        json={
            "heading": "Chess Openings",
            "cueText": "e4 and d4 are common first moves",
            "summary": "e4 supports open tactical games; d4 often supports queen's pawn structures.",
            "boxes": [
                {"id": 1, "content": "e4", "lines": []},
                {"id": 2, "content": "d4", "lines": []},
                {"id": 3, "content": "c4", "lines": []},
            ],
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "placeholder"
    assert data["puzzles"]
    assert {p["type"] for p in data["puzzles"]} & {"multiple_choice", "short_answer"}


def test_ai_coach_gemini_returns_sanitized_puzzles(client: TestClient, monkeypatch) -> None:
    from app.config import settings

    monkeypatch.setattr(settings, "ai_provider", "gemini")
    monkeypatch.setattr(settings, "gemini_api_key", "test-key")

    model_json = json.dumps(
        {
            "puzzles": [
                {
                    "id": "q1",
                    "type": "multiple_choice",
                    "prompt": "Which move is described as central?",
                    "choices": [
                        {"id": "A", "text": "e4"},
                        {"id": "B", "text": "h4"},
                        {"id": "C", "text": "a4"},
                    ],
                    "answer": "A",
                    "acceptable_answers": [],
                    "explanation": "e4 is the central move in the note. If missed, compare the options and try again.",
                    "source_box_ids": [1, 999],
                },
                {
                    "id": "bad",
                    "type": "multiple_choice",
                    "prompt": "Invalid answer should drop",
                    "choices": [{"id": "A", "text": "x"}],
                    "answer": "Z",
                    "acceptable_answers": [],
                    "explanation": "bad",
                    "source_box_ids": [],
                },
            ]
        }
    )
    _patch_gemini_response(monkeypatch, model_json)

    r = client.post(
        "/ai/coach",
        json={
            "heading": "Chess",
            "cueText": "",
            "summary": "",
            "boxes": [{"id": 1, "content": "e4", "lines": []}],
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["puzzles"] == [
        {
            "id": "q1",
            "type": "multiple_choice",
            "prompt": "Which move is described as central?",
            "choices": [
                {"id": "A", "text": "e4"},
                {"id": "B", "text": "h4"},
                {"id": "C", "text": "a4"},
            ],
            "answer": "A",
            "acceptable_answers": [],
            "explanation": "e4 is the central move in the note. If missed, compare the options and try again.",
            "source_box_ids": [1],
        }
    ]
