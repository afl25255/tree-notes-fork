"""Server-side note analysis: Gemini, optional Ollama, or placeholder (switch via env).

The model is asked for a strict JSON object with three fields:
  - analysis: markdown bullets for the insights panel
  - concepts: short noun-phrase keywords pulled from the note
  - suggested_links: pairs of EXISTING box ids the model thinks should be linked

Gemini is called with ``responseMimeType=application/json`` + a response schema,
Ollama with ``format=json``. Output is sanitized server-side (unknown ids,
self-links and duplicates are dropped) so the frontend can trust the payload.
"""

from __future__ import annotations

import json
from typing import Any

import httpx

from app.config import settings
from app.schemas import AiAnalyzeOut, AiAnalyzeRequest, SuggestedLinkPair

_RESPONSE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "analysis": {"type": "string"},
        "concepts": {"type": "array", "items": {"type": "string"}},
        "suggested_links": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "a": {"type": "integer"},
                    "b": {"type": "integer"},
                },
                "required": ["a", "b"],
            },
        },
    },
    "required": ["analysis", "concepts", "suggested_links"],
}


def _build_prompt(body: AiAnalyzeRequest) -> str:
    box_lines: list[str] = []
    for b in sorted(body.boxes, key=lambda x: x.id):
        links = ", ".join(b.lines) if b.lines else "none"
        box_lines.append(f"Box {b.id}: {b.content or '(empty)'}\n  linked to box ids: {links}")
    notes_body = "\n".join(box_lines) if box_lines else "(empty)"
    valid_ids = sorted({b.id for b in body.boxes})

    return "\n".join(
        [
            "You are an academic assistant analysing Cornell notes.",
            "Return STRICT JSON matching this shape:",
            '{ "analysis": "<markdown bullets>",',
            '  "concepts": ["short noun phrase", ...],',
            '  "suggested_links": [{"a": <box id>, "b": <box id>}, ...] }',
            "",
            "Rules:",
            "- analysis: 3 bullet insights connecting cues to notes,",
            "  any gaps/follow-up questions, and one actionable recommendation.",
            "- concepts: 5-10 short noun phrases (no sentences, no duplicates).",
            "- suggested_links: pairs of EXISTING box ids that should be linked but aren't yet.",
            f"  Valid box ids: {valid_ids if valid_ids else '[]'}.",
            "  Do NOT invent ids. Do NOT include self-links (a == b).",
            "  Return at most 8 pairs.",
            "",
            "Heading:",
            body.heading or "(none)",
            "",
            "Cue Column:",
            body.cueText or "(empty)",
            "",
            "Notes column (boxes):",
            notes_body,
            "",
            "Summary:",
            body.summary or "(empty)",
        ]
    )


def _text_from_gemini_response(data: dict[str, Any]) -> str:
    cands = data.get("candidates") or []
    if not cands:
        fb = data.get("promptFeedback")
        if fb:
            raise ValueError(f"Model returned no candidates: {fb}")
        raise ValueError("Model returned no candidates (safety filter or empty response).")
    chunks: list[str] = []
    for c in cands:
        content = c.get("content") or {}
        for p in content.get("parts") or []:
            t = p.get("text")
            if t:
                chunks.append(t)
    return "\n".join(chunks).strip()


def _gemini_generate(prompt: str) -> str:
    model = settings.gemini_model.strip()
    key = settings.gemini_api_key.strip()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    payload: dict[str, Any] = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 4096,
            "responseMimeType": "application/json",
            "responseSchema": _RESPONSE_SCHEMA,
        },
    }
    with httpx.Client(timeout=120.0) as client:
        r = client.post(url, params={"key": key}, json=payload)
        try:
            r.raise_for_status()
        except httpx.HTTPStatusError as e:
            try:
                err = e.response.json()
                msg = err.get("error", {}).get("message") or e.response.text
            except Exception:
                msg = e.response.text
            raise ValueError(f"Gemini API ({e.response.status_code}): {msg[:500]}") from e
        return _text_from_gemini_response(r.json())


def _ollama_generate(prompt: str) -> str:
    base = settings.ollama_base_url.rstrip("/")
    url = f"{base}/api/generate"
    payload = {
        "model": settings.ollama_model.strip() or "llama3",
        "prompt": prompt,
        "stream": False,
        "format": "json",
    }
    with httpx.Client(timeout=120.0) as client:
        r = client.post(url, json=payload)
        try:
            r.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise ValueError(
                f"Ollama HTTP {e.response.status_code} at {url}. Is the server running?"
            ) from e
        data = r.json()
    return (data.get("response") or "").strip()


def _sanitize_concepts(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    out: list[str] = []
    seen: set[str] = set()
    for item in value:
        if not isinstance(item, str):
            continue
        s = item.strip()
        if not s:
            continue
        key = s.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(s)
        if len(out) >= 20:
            break
    return out


def _sanitize_links(value: Any, valid_ids: set[int]) -> list[SuggestedLinkPair]:
    # No box ids in the note → nothing to link, regardless of what the model produced.
    if not isinstance(value, list) or not valid_ids:
        return []
    out: list[SuggestedLinkPair] = []
    seen: set[tuple[int, int]] = set()
    for item in value:
        if not isinstance(item, dict):
            continue
        try:
            a = int(item.get("a"))
            b = int(item.get("b"))
        except (TypeError, ValueError):
            continue
        if a == b:
            continue
        if a not in valid_ids or b not in valid_ids:
            continue
        pair = (a, b) if a < b else (b, a)
        if pair in seen:
            continue
        seen.add(pair)
        out.append(SuggestedLinkPair(a=pair[0], b=pair[1]))
        if len(out) >= 8:
            break
    return out


def _build_structured_output(text: str, valid_ids: set[int]) -> AiAnalyzeOut:
    if not text or not text.strip():
        return AiAnalyzeOut(status="error", message="Model returned empty text.", analysis="")
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # Older models / non-JSON-mode fallback: keep raw text as the analysis blob
        # so the UI still has something to show, but leave structured fields empty.
        return AiAnalyzeOut(status="ok", analysis=text.strip())
    if not isinstance(data, dict):
        return AiAnalyzeOut(status="ok", analysis=text.strip())
    analysis = str(data.get("analysis") or "").strip()
    concepts = _sanitize_concepts(data.get("concepts"))
    suggested_links = _sanitize_links(data.get("suggested_links"), valid_ids)
    return AiAnalyzeOut(
        status="ok",
        analysis=analysis,
        concepts=concepts,
        suggested_links=suggested_links,
    )


def _effective_provider() -> str:
    p = (settings.ai_provider or "auto").strip().lower()
    if p == "auto":
        return "gemini" if settings.gemini_api_key.strip() else "placeholder"
    if p in ("gemini", "ollama", "placeholder"):
        return p
    return "placeholder"


def run_ai_analyze(body: AiAnalyzeRequest) -> AiAnalyzeOut:
    prov = _effective_provider()
    valid_ids = {b.id for b in body.boxes}
    if prov == "placeholder":
        return AiAnalyzeOut(
            status="placeholder",
            message="AI is not enabled. Set GEMINI_API_KEY (recommended) or AI_PROVIDER=ollama on the server.",
            analysis="",
        )
    if prov == "gemini":
        if not settings.gemini_api_key.strip():
            return AiAnalyzeOut(
                status="error",
                message="AI_PROVIDER=gemini but GEMINI_API_KEY is empty.",
                analysis="",
            )
        try:
            text = _gemini_generate(_build_prompt(body))
        except Exception as e:
            return AiAnalyzeOut(status="error", message=str(e)[:800], analysis="")
        return _build_structured_output(text, valid_ids)
    if prov == "ollama":
        try:
            text = _ollama_generate(_build_prompt(body))
        except Exception as e:
            return AiAnalyzeOut(status="error", message=str(e)[:800], analysis="")
        return _build_structured_output(text, valid_ids)
    return AiAnalyzeOut(status="placeholder", message="Unknown AI_PROVIDER.", analysis="")
