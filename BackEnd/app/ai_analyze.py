"""Server-side note analysis: Gemini, optional Ollama, or placeholder (switch via env)."""

from __future__ import annotations

from typing import Any

import httpx

from app.config import settings
from app.schemas import AiAnalyzeOut, AiAnalyzeRequest


def _build_prompt(body: AiAnalyzeRequest) -> str:
    box_lines: list[str] = []
    for b in sorted(body.boxes, key=lambda x: x.id):
        links = ", ".join(b.lines) if b.lines else "none"
        box_lines.append(f"Box {b.id}: {b.content or '(empty)'}\n  linked to box ids: {links}")
    notes_body = "\n".join(box_lines) if box_lines else "(empty)"

    return "\n".join(
        [
            "You are an academic assistant analysing Cornell notes.",
            "Review the provided sections (Heading, Cue column, Notes boxes, Summary) and return:",
            "- Three bullet-point insights that connect cues to notes.",
            "- Any gaps or follow-up questions the student should address.",
            "- One actionable recommendation to deepen understanding.",
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
            "",
            "Respond concisely using Markdown bullets where appropriate.",
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
        "generationConfig": {"temperature": 0.5, "maxOutputTokens": 4096},
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


def _effective_provider() -> str:
    p = (settings.ai_provider or "auto").strip().lower()
    if p == "auto":
        return "gemini" if settings.gemini_api_key.strip() else "placeholder"
    if p in ("gemini", "ollama", "placeholder"):
        return p
    return "placeholder"


def run_ai_analyze(body: AiAnalyzeRequest) -> AiAnalyzeOut:
    prov = _effective_provider()
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
            if not text:
                return AiAnalyzeOut(
                    status="error",
                    message="Model returned empty text.",
                    analysis="",
                )
            return AiAnalyzeOut(status="ok", message="", analysis=text)
        except Exception as e:
            return AiAnalyzeOut(status="error", message=str(e)[:800], analysis="")
    if prov == "ollama":
        try:
            text = _ollama_generate(_build_prompt(body))
            if not text:
                return AiAnalyzeOut(
                    status="error",
                    message="Ollama returned empty text.",
                    analysis="",
                )
            return AiAnalyzeOut(status="ok", message="", analysis=text)
        except Exception as e:
            return AiAnalyzeOut(status="error", message=str(e)[:800], analysis="")
    return AiAnalyzeOut(status="placeholder", message="Unknown AI_PROVIDER.", analysis="")
