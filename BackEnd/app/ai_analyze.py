"""Server-side note analysis: Gemini, optional Ollama, or placeholder (switch via env).

The model is asked for a strict JSON object with five fields:
  - overview: notable bullet-point insights for the insights panel
  - study_analysis: extended SWOT-style study analysis for Cornell notes
  - concepts: short noun-phrase keywords pulled from the note
  - suggested_links: pairs of EXISTING box ids the model thinks should be linked
  - see_also: external links for further study
  - videos: YouTube videos or podcasts for further study

Gemini is called with ``responseMimeType=application/json`` + a response schema,
OpenAI with Responses API structured outputs, and Ollama with ``format=json``.
Output is sanitized server-side (unknown ids, self-links and duplicates are
dropped) so the frontend can trust the payload.
"""

from __future__ import annotations

import json
from copy import deepcopy
from typing import Any
from urllib.parse import urlparse

import httpx

from app.config import settings
from app.schemas import (
    AiAnalyzeOut,
    AiAnalyzeRequest,
    ExternalLink,
    StudyAnalysis,
    SuggestedLinkPair,
)

_RESPONSE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "overview": {"type": "array", "items": {"type": "string"}},
        "study_analysis": {
            "type": "object",
            "properties": {
                "strengths": {"type": "array", "items": {"type": "string"}},
                "weaknesses": {"type": "array", "items": {"type": "string"}},
                "opportunities": {"type": "array", "items": {"type": "string"}},
                "threats": {"type": "array", "items": {"type": "string"}},
                "recommended_improvements": {"type": "array", "items": {"type": "string"}},
            },
            "required": [
                "strengths",
                "weaknesses",
                "opportunities",
                "threats",
                "recommended_improvements",
            ],
        },
        "concepts": {"type": "array", "items": {"type": "string"}},
        "suggested_links": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "a": {"type": "integer"},
                    "a_content": {"type": "string"},
                    "b": {"type": "integer"},
                    "b_content": {"type": "string"},
                },
                "required": ["a", "a_content", "b", "b_content"],
            },
        },
        "see_also": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "url": {"type": "string"},
                },
                "required": ["title", "url"],
            },
        },
        "videos": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "url": {"type": "string"},
                },
                "required": ["title", "url"],
            },
        },
    },
    "required": ["overview", "study_analysis", "concepts", "suggested_links", "see_also", "videos"],
}


def _openai_response_schema() -> dict[str, Any]:
    schema = deepcopy(_RESPONSE_SCHEMA)

    def mark_objects(node: Any) -> None:
        if not isinstance(node, dict):
            return
        if node.get("type") == "object":
            node["additionalProperties"] = False
        for child in node.get("properties", {}).values():
            mark_objects(child)
        mark_objects(node.get("items"))

    mark_objects(schema)
    return schema


def _build_prompt(body: AiAnalyzeRequest) -> str:
    box_lines: list[str] = []
    for b in sorted(body.boxes, key=lambda x: x.id):
        links = ", ".join(b.lines) if b.lines else "none"
        box_lines.append(f"Box {b.id}: {b.content or '(empty)'}\n  linked to box ids: {links}")
    notes_body = "\n".join(box_lines) if box_lines else "(empty)"
    valid_ids = sorted({b.id for b in body.boxes})
    pro_mode = bool(body.pro_mode)
    source_rules = [
        "- see_also: 2-4 reputable academic links (studies, articles, official references) relevant to the note content.",
        "- videos: 1-3 YouTube video or podcast links for video/audio learners.",
        "  Use stable, likely-valid http/https URLs only. If unsure, return fewer links rather than invented URLs.",
    ]
    if pro_mode:
        source_rules = [
            "- Pro Mode is enabled: prefer highly reputable academic/scientific sources only.",
            "  Prioritize sources such as PubMed, Google Scholar-indexed papers, JSTOR, Scopus-indexed journals, university pages,",
            "  government/medical/legal authorities, and major scholarly publishers.",
            "  Avoid casual blogs, low-authority summaries, and unsourced content.",
            "- see_also: 2-4 highly reputable academic links relevant to the note content.",
            "- videos: 0-2 reputable YouTube lectures, university channels, conference talks, or academic podcasts only.",
            "  Use stable, likely-valid http/https URLs only. If unsure, return fewer links rather than invented URLs.",
        ]

    return "\n".join(
        [
            "You are an academic assistant analysing Cornell notes.",
            "Return STRICT JSON matching this shape:",
            '{ "overview": ["notable bullet point", ...],',
            '  "study_analysis": {',
            '    "strengths": ["short-term helpful study point", ...],',
            '    "weaknesses": ["short-term harmful study point", ...],',
            '    "opportunities": ["long-term helpful study point", ...],',
            '    "threats": ["long-term harmful study point", ...],',
            '    "recommended_improvements": ["next best move for this note", ...]',
            "  },",
            '  "concepts": ["short noun phrase", ...],',
            '  "suggested_links": [{"a": <box id>, "a_content": "<box content>", "b": <box id>, "b_content": "<box content>"}, ...],',
            '  "see_also": [{"title": "<link title>", "url": "<url>"}, ...],',
            '  "videos": [{"title": "<video title>", "url": "<youtube url>"}, ...] }',
            "",
            "Rules:",
            "- overview: 3-5 concise, notable bullet points that summarize the total note content. Do not include markdown bullets or headings.",
            "- study_analysis: extended SWOT-style analysis for study/Cornell notes.",
            "  Strengths = short-term helpful. Weaknesses = short-term harmful.",
            "  Opportunities = long-term helpful. Threats = long-term harmful.",
            "  recommended_improvements = the next best moves for improving this note.",
            "  Return 1-3 concise items for each analysis category.",
            "- concepts: various short noun phrases, keywords, important names, ideas and concepts.",
            "- suggested_links: pairs of EXISTING box ids that should be linked but aren't yet.",
            "  Include the exact box content for a_content and b_content.",
            f"  Valid box ids: {valid_ids if valid_ids else '[]'}.",
            "  Do NOT invent ids. Do NOT include self-links (a == b).",
            "  Return at most 8 pairs.",
            *source_rules,
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


def _gemini_generate(prompt: str, model_override: str = "") -> str:
    model = (model_override or settings.gemini_model).strip()
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


def _text_from_openai_response(data: dict[str, Any]) -> str:
    output_text = data.get("output_text")
    if isinstance(output_text, str) and output_text.strip():
        return output_text.strip()

    chunks: list[str] = []
    for item in data.get("output") or []:
        for content in item.get("content") or []:
            text = content.get("text")
            if isinstance(text, str) and text:
                chunks.append(text)
    return "\n".join(chunks).strip()


def _openai_generate(prompt: str, model_override: str = "") -> str:
    model = (model_override or settings.openai_model).strip() or "gpt-5-mini"
    key = settings.openai_api_key.strip()
    url = "https://api.openai.com/v1/responses"
    payload: dict[str, Any] = {
        "model": model,
        "input": [{"role": "user", "content": [{"type": "input_text", "text": prompt}]}],
        "max_output_tokens": 4096,
        "text": {
            "format": {
                "type": "json_schema",
                "name": "tree_notes_analysis",
                "strict": True,
                "schema": _openai_response_schema(),
            }
        },
    }
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    with httpx.Client(timeout=120.0) as client:
        r = client.post(url, headers=headers, json=payload)
        try:
            r.raise_for_status()
        except httpx.HTTPStatusError as e:
            try:
                err = e.response.json()
                msg = err.get("error", {}).get("message") or e.response.text
            except Exception:
                msg = e.response.text
            raise ValueError(f"OpenAI API ({e.response.status_code}): {msg[:500]}") from e
        return _text_from_openai_response(r.json())


def _ollama_generate(prompt: str, model_override: str = "") -> str:
    base = settings.ollama_base_url.rstrip("/")
    url = f"{base}/api/generate"
    payload = {
        "model": (model_override or settings.ollama_model).strip() or "llama3",
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


def _sanitize_overview(value: Any) -> list[str]:
    if isinstance(value, str):
        items = value.replace("\r\n", "\n").split("\n")
    elif isinstance(value, list):
        items = value
    else:
        return []

    out: list[str] = []
    seen: set[str] = set()
    for item in items:
        if not isinstance(item, str):
            continue
        s = item.strip()
        if s.startswith(("- ", "* ")):
            s = s[2:].strip()
        if not s:
            continue
        key = s.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(s)
        if len(out) >= 5:
            break
    return out


def _sanitize_short_list(value: Any, limit: int = 3) -> list[str]:
    if not isinstance(value, list):
        return []
    out: list[str] = []
    seen: set[str] = set()
    for item in value:
        if not isinstance(item, str):
            continue
        s = item.strip()
        if s.startswith(("- ", "* ")):
            s = s[2:].strip()
        if not s:
            continue
        key = s.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(s)
        if len(out) >= limit:
            break
    return out


def _sanitize_study_analysis(value: Any) -> StudyAnalysis:
    if not isinstance(value, dict):
        return StudyAnalysis()
    return StudyAnalysis(
        strengths=_sanitize_short_list(value.get("strengths")),
        weaknesses=_sanitize_short_list(value.get("weaknesses")),
        opportunities=_sanitize_short_list(value.get("opportunities")),
        threats=_sanitize_short_list(value.get("threats")),
        recommended_improvements=_sanitize_short_list(value.get("recommended_improvements")),
    )


def _sanitize_links(value: Any, box_contents: dict[int, str]) -> list[SuggestedLinkPair]:
    # No box ids in the note → nothing to link, regardless of what the model produced.
    if not isinstance(value, list) or not box_contents:
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
        if a not in box_contents or b not in box_contents:
            continue
        pair = (a, b) if a < b else (b, a)
        if pair in seen:
            continue
        seen.add(pair)
        out.append(
            SuggestedLinkPair(
                a=pair[0],
                a_content=box_contents.get(pair[0], ""),
                b=pair[1],
                b_content=box_contents.get(pair[1], ""),
            )
        )
        if len(out) >= 8:
            break
    return out


def _sanitize_see_also(value: Any) -> list[ExternalLink]:
    if not isinstance(value, list):
        return []
    out: list[ExternalLink] = []
    for item in value:
        if not isinstance(item, dict):
            continue
        title = item.get("title")
        url = item.get("url")
        if not isinstance(title, str) or not isinstance(url, str):
            continue
        clean_title = title.strip()
        clean_url = url.strip()
        parsed = urlparse(clean_url)
        if not clean_title or parsed.scheme not in {"http", "https"} or not parsed.netloc:
            continue
        out.append(ExternalLink(title=clean_title, url=clean_url))
        if len(out) >= 5:
            break
    return out


def _sanitize_videos(value: Any) -> list[ExternalLink]:
    links = _sanitize_see_also(value)
    out: list[ExternalLink] = []
    for link in links:
        host = urlparse(link.url).netloc.lower()
        if "youtube.com" not in host and "youtu.be" not in host:
            continue
        out.append(link)
        if len(out) >= 3:
            break
    return out


def _structured_to_analysis_text(overview: list[str], study_analysis: StudyAnalysis) -> str:
    blocks: list[str] = []
    if overview:
        blocks.append("Overview:\n" + "\n".join(f"- {item}" for item in overview))
    swot_sections = [
        ("Strengths", study_analysis.strengths),
        ("Weaknesses", study_analysis.weaknesses),
        ("Opportunities", study_analysis.opportunities),
        ("Threats", study_analysis.threats),
        ("Recommended improvements", study_analysis.recommended_improvements),
    ]
    swot_text = "\n\n".join(
        f"{heading}:\n" + "\n".join(f"- {item}" for item in items)
        for heading, items in swot_sections
        if items
    )
    if swot_text:
        blocks.append("Analysis:\n" + swot_text)
    return "\n\n".join(blocks)


def _extract_json_object(text: str) -> dict[str, Any] | None:
    raw = text.strip()
    candidates = [raw]
    if raw.startswith("```"):
        fenced = raw.removeprefix("```json").removeprefix("```").strip()
        if fenced.endswith("```"):
            fenced = fenced[:-3].strip()
        candidates.append(fenced)

    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidates.append(raw[start : end + 1])

    for candidate in candidates:
        try:
            data = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                continue
        if isinstance(data, dict):
            nested = data.get("analysis")
            if "overview" not in data and isinstance(nested, str):
                parsed_nested = _extract_json_object(nested)
                if parsed_nested:
                    return parsed_nested
            return data
    return None


def _build_structured_output(text: str, box_contents: dict[int, str]) -> AiAnalyzeOut:
    if not text or not text.strip():
        return AiAnalyzeOut(status="error", message="Model returned empty text.", analysis="")
    data = _extract_json_object(text)
    if data is None:
        # Older models / non-JSON-mode fallback: keep raw text as the analysis blob
        # so the UI still has something to show, but leave structured fields empty.
        return AiAnalyzeOut(status="ok", analysis=text.strip())
    overview = _sanitize_overview(data.get("overview"))
    study_analysis = _sanitize_study_analysis(data.get("study_analysis"))
    analysis = _structured_to_analysis_text(overview, study_analysis) or str(data.get("analysis") or "").strip()
    concepts = _sanitize_concepts(data.get("concepts"))
    suggested_links = _sanitize_links(data.get("suggested_links"), box_contents)
    see_also = _sanitize_see_also(data.get("see_also"))
    videos = _sanitize_videos(data.get("videos"))
    return AiAnalyzeOut(
        status="ok",
        overview=overview,
        study_analysis=study_analysis,
        analysis=analysis,
        concepts=concepts,
        suggested_links=suggested_links,
        see_also=see_also,
        videos=videos,
    )


def _effective_provider(requested_provider: str | None = None) -> str:
    p = (requested_provider or settings.ai_provider or "auto").strip().lower()
    if p == "auto":
        if settings.gemini_api_key.strip():
            return "gemini"
        if settings.openai_api_key.strip():
            return "openai"
        return "placeholder"
    if p in ("gemini", "openai", "ollama", "placeholder"):
        return p
    return "placeholder"


def _requested_model(body: AiAnalyzeRequest, provider: str) -> str:
    model = (body.llm_model or "").strip()
    if not model:
        return ""
    allowed_prefixes = {
        "gemini": ("gemini-",),
        "openai": ("gpt-", "o"),
        "ollama": ("",),
    }
    prefixes = allowed_prefixes.get(provider)
    if prefixes is None:
        return ""
    if prefixes == ("",):
        return model
    return model if model.startswith(prefixes) else ""


def run_ai_analyze(body: AiAnalyzeRequest) -> AiAnalyzeOut:
    prov = _effective_provider(body.llm_provider)
    model_override = _requested_model(body, prov)
    box_contents = {b.id: b.content for b in body.boxes}
    if prov == "placeholder":
        return AiAnalyzeOut(
            status="placeholder",
            message="AI is not enabled. Set GEMINI_API_KEY, OPENAI_API_KEY, or AI_PROVIDER=ollama on the server.",
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
            text = _gemini_generate(_build_prompt(body), model_override)
        except Exception as e:
            return AiAnalyzeOut(status="error", message=str(e)[:800], analysis="")
        return _build_structured_output(text, box_contents)
    if prov == "openai":
        if not settings.openai_api_key.strip():
            return AiAnalyzeOut(
                status="error",
                message="AI_PROVIDER=openai but OPENAI_API_KEY is empty.",
                analysis="",
            )
        try:
            text = _openai_generate(_build_prompt(body), model_override)
        except Exception as e:
            return AiAnalyzeOut(status="error", message=str(e)[:800], analysis="")
        return _build_structured_output(text, box_contents)
    if prov == "ollama":
        try:
            text = _ollama_generate(_build_prompt(body), model_override)
        except Exception as e:
            return AiAnalyzeOut(status="error", message=str(e)[:800], analysis="")
        return _build_structured_output(text, box_contents)
    return AiAnalyzeOut(status="placeholder", message="Unknown AI_PROVIDER.", analysis="")
