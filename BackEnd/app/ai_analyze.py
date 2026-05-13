"""Server-side note analysis: Gemini, optional Ollama, or placeholder (switch via env).

The model is asked for a strict JSON object with six fields:
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

import ast
import json
import re
from copy import deepcopy
from typing import Any
from urllib.parse import parse_qs, urlparse

import httpx

from app.config import settings
from app.schemas import (
    AiAnalyzeOut,
    AiAnalyzeRequest,
    ExternalLink,
    StudyAnalysis,
    SuggestedLinkPair,
    VideoLink,
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
                    "favicon": {"type": "string"},
                    "title": {"type": "string"},
                    "url": {"type": "string"},
                },
                "required": ["favicon", "title", "url"],
            },
        },
        "videos": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "thumbnail": {"type": "string"},
                    "title": {"type": "string"},
                    "channel": {"type": "string"},
                    "url": {"type": "string"},
                },
                "required": ["thumbnail", "title", "channel", "url"],
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
        "- videos: 1-3 real, existing YouTube videos or podcasts for video/audio learners.",
        "  Only include specific YouTube video URLs that you are confident exist; if unsure, return [].",
    ]
    if pro_mode:
        source_rules = [
            "- Pro Mode is enabled: prefer highly reputable academic/scientific sources only.",
            "  Prioritize sources such as PubMed, Google Scholar-indexed papers, JSTOR, Scopus-indexed journals, university pages,",
            "  government/medical/legal authorities, and major scholarly publishers.",
            "  Avoid casual blogs, low-authority summaries, and unsourced content.",
            "- see_also: 2-4 highly reputable academic links relevant to the note content.",
            "- videos: 0-2 real, existing reputable YouTube lectures, university channels, conference talks, or academic podcasts only.",
            "  Only include specific YouTube video URLs that you are confident exist; if unsure, return [].",
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
            '  "see_also": [{"favicon": "<emoji or short source mark>", "title": "<link title>", "url": "<url>"}, ...],',
            '  "videos": [{"thumbnail": "<thumbnail image url>", "title": "<video title>", "channel": "<video channel>", "url": "<youtube video url>"}, ...] }',
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
            "  Prefer missing links that would improve understanding; do not simply repeat every existing link.",
            "  Return at most 8 pairs.",
            "- videos: use fields thumbnail, title, channel, url. For YouTube, thumbnail should be a valid i.ytimg.com thumbnail when known.",
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


def _gemini_generate(prompt: str, model_override: str = "", api_key: str = "") -> str:
    model = (model_override or settings.gemini_model).strip()
    key = (api_key or settings.gemini_api_key).strip()
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


def _openai_generate(prompt: str, model_override: str = "", api_key: str = "") -> str:
    model = (model_override or settings.openai_model).strip() or "gpt-5-mini"
    key = (api_key or settings.openai_api_key).strip()
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


def _ollama_generate(prompt: str, model_override: str = "", base_url: str = "") -> str:
    base = (base_url or settings.ollama_base_url).rstrip("/")
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


def _content_tokens(text: str) -> set[str]:
    stopwords = {
        "the",
        "and",
        "for",
        "with",
        "that",
        "this",
        "from",
        "are",
        "was",
        "were",
        "has",
        "have",
        "not",
        "box",
        "new",
    }
    return {
        token.lower()
        for token in re.findall(r"[A-Za-z0-9][A-Za-z0-9'/-]{1,}", text)
        if token.lower() not in stopwords
    }


def _is_placeholder_box(content: str) -> bool:
    return not content.strip() or content.strip().lower() in {"seed", "new box", "new seed", "untitled"}


def _opening_family(content: str) -> str:
    text = content.lower()
    if "e4" in text:
        return "e4"
    if "d4" in text:
        return "d4"
    if "c4" in text:
        return "c4"
    if "nf3" in text:
        return "nf3"
    return ""


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
        favicon = item.get("favicon")
        clean_favicon = favicon.strip() if isinstance(favicon, str) else ""
        if not clean_favicon:
            clean_favicon = parsed.netloc.removeprefix("www.")[:1].upper()
        out.append(ExternalLink(favicon=clean_favicon, title=clean_title, url=clean_url))
        if len(out) >= 5:
            break
    return out


def _sanitize_videos(value: Any) -> list[VideoLink]:
    if not isinstance(value, list):
        return []
    out: list[VideoLink] = []
    for item in value:
        if not isinstance(item, dict):
            continue
        raw_title = item.get("title") or item.get("video title") or item.get("video_title")
        raw_channel = item.get("channel") or item.get("video channel") or item.get("video_channel") or ""
        raw_url = item.get("url")
        if not isinstance(raw_title, str) or not isinstance(raw_url, str):
            continue
        title = raw_title.strip()
        url = raw_url.strip()
        parsed = urlparse(url)
        host = parsed.netloc.lower()
        if not title or parsed.scheme not in {"http", "https"}:
            continue
        if "youtube.com" not in host and "youtu.be" not in host:
            continue
        video_id = _youtube_video_id(url)
        if not video_id:
            continue
        thumbnail = item.get("thumbnail") or item.get("video thumbnail") or item.get("thumbnail_url") or ""
        if not isinstance(thumbnail, str) or not thumbnail.strip():
            thumbnail = f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
        out.append(
            VideoLink(
                thumbnail=thumbnail.strip(),
                title=title,
                channel=raw_channel.strip() if isinstance(raw_channel, str) else "",
                url=url,
            )
        )
        if len(out) >= 3:
            break
    return out


def _youtube_video_id(url: str) -> str:
    parsed = urlparse(url)
    host = parsed.netloc.lower()
    if "youtu.be" in host:
        candidate = parsed.path.strip("/").split("/")[0]
    else:
        params = parse_qs(parsed.query)
        candidate = (params.get("v") or [""])[0]
        if not candidate and "/shorts/" in parsed.path:
            candidate = parsed.path.split("/shorts/", 1)[1].split("/", 1)[0]
        if not candidate and "/embed/" in parsed.path:
            candidate = parsed.path.split("/embed/", 1)[1].split("/", 1)[0]
    return candidate if re.fullmatch(r"[A-Za-z0-9_-]{11}", candidate or "") else ""


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
            try:
                data = ast.literal_eval(candidate)
            except (SyntaxError, ValueError):
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
            if "overview" not in data and isinstance(nested, dict):
                return nested
            return data
    return None


def _clean_model_text_for_fallback(text: str) -> str:
    cleaned = text.strip()
    cleaned = cleaned.removeprefix("```json").removeprefix("```").removesuffix("```")
    cleaned = re.sub(r'["{}\[\],:]+', " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def _note_text_for_fallback(body: AiAnalyzeRequest, box_contents: dict[int, str]) -> str:
    parts = [
        body.heading.strip(),
        body.cueText.strip(),
        body.summary.strip(),
        *[content.strip() for _, content in sorted(box_contents.items())],
    ]
    return " ".join(part for part in parts if part)


def _fallback_overview(body: AiAnalyzeRequest, box_contents: dict[int, str], model_text: str) -> list[str]:
    note_text = _note_text_for_fallback(body, box_contents)
    overview: list[str] = []
    heading = body.heading.strip()
    heading_words = _content_tokens(heading)
    concepts = [
        concept
        for concept in _fallback_concepts(body, box_contents)
        if concept.lower() != heading.lower()
        and concept.lower() not in heading_words
    ]
    first_concepts = concepts[:4]
    if heading:
        if first_concepts:
            overview.append(
                f"{heading} is organized around {', '.join(first_concepts[:-1])}"
                f"{' and ' if len(first_concepts) > 1 else ''}{first_concepts[-1] if first_concepts else ''}."
            )
        else:
            overview.append(f"The note focuses on {heading}.")

    box_items = [(box_id, content.strip()) for box_id, content in sorted(box_contents.items()) if content.strip()]
    if len(box_items) >= 2:
        overview.append(
            "The note uses a visual map of seed cells to compare related ideas and possible study connections."
        )

    source = body.cueText.strip() or body.summary.strip() or note_text or _clean_model_text_for_fallback(model_text)
    for sentence in re.split(r"(?<=[.!?])\s+|(?:\n\s*-\s+)|(?:\s+-\s+)", source):
        sentence = sentence.strip(" -")
        if not sentence or len(sentence) < 8:
            continue
        if sentence.lower() in {"new box", "seed"}:
            continue
        if sentence not in overview:
            overview.append(sentence[:220])
        if len(overview) >= 4:
            break
    if not overview:
        overview.append("The note contains limited analyzable content and needs more detail before a full AI overview can be produced.")
    return overview[:5]


def _fallback_concepts(body: AiAnalyzeRequest, box_contents: dict[int, str]) -> list[str]:
    candidates: list[str] = []
    stopwords = {
        "and", "are", "also", "too", "want", "with", "best", "test", "according",
        "other", "more", "less", "used", "known", "leads", "leading", "minute",
        "minutes", "opponents", "outsmart", "common", "response", "guarded",
        "considered", "respectively", "often", "most", "many", "within",
    }
    for value in [body.heading, body.cueText, body.summary, *box_contents.values()]:
        value = value.strip()
        if not value:
            continue
        if len(value) <= 40:
            candidates.append(value)
        candidates.extend(re.findall(r"\b[A-Z][A-Za-z0-9'/-]*(?:\s+[A-Z][A-Za-z0-9'/-]*){0,2}\b", value))
        candidates.extend(
            token
            for token in re.findall(r"\b[a-zA-Z][A-Za-z0-9'/-]{1,}\b", value)
            if token.lower() not in stopwords and (len(token) > 2 or re.search(r"\d", token))
        )
    return _sanitize_concepts(candidates)[:20]


def _fallback_study_analysis(body: AiAnalyzeRequest, box_contents: dict[int, str]) -> StudyAnalysis:
    has_content = bool(_note_text_for_fallback(body, box_contents))
    if not has_content:
        return StudyAnalysis(
            weaknesses=["The note has too little content for reliable analysis."],
            recommended_improvements=["Add core facts, examples, and a brief summary before retrying AI analysis."],
        )
    populated_boxes = [content for content in box_contents.values() if not _is_placeholder_box(content)]
    placeholder_count = len(box_contents) - len(populated_boxes)
    linked_ids = {str(line) for b in body.boxes for line in b.lines}
    strengths = [
        "The note captures concrete terms and examples that can be reviewed as active recall prompts."
    ]
    if len(populated_boxes) >= 3:
        strengths.append("The seed-cell layout supports comparison between related subtopics instead of a single linear outline.")
    if body.summary.strip():
        strengths.append("The summary section gives the note a concise review target after studying the details.")

    weaknesses = []
    if placeholder_count:
        weaknesses.append("Some seed cells are empty or still generic, which weakens the map as a study aid.")
    if not body.summary.strip():
        weaknesses.append("The summary is missing, so the note lacks a final synthesis checkpoint.")
    if len(populated_boxes) and len(linked_ids) < max(1, len(populated_boxes) // 2):
        weaknesses.append("Several ideas appear under-linked, making relationships harder to revise later.")
    if not weaknesses:
        weaknesses.append("Some explanations are still terse and would benefit from definitions, examples, and reasons.")

    opportunities = [
        "Add named examples, causes, consequences, or standard cases to turn each seed into a stronger revision unit.",
        "Use suggested links to connect ideas that share a principle, contrast, or sequence.",
    ]
    threats = [
        "Memorising isolated keywords without explanations can create shallow recall under exam or practice pressure.",
        "Unverified claims or missing examples may make the note feel complete while leaving important gaps."
    ]
    improvements = [
        "Replace generic or empty seed cells with precise terms, definitions, or worked examples.",
        "Add missing links between related boxes and write one sentence explaining why each link matters.",
        "Expand the summary into a compact answer that could be used for self-testing."
    ]
    return StudyAnalysis(
        strengths=strengths[:3],
        weaknesses=weaknesses[:3],
        opportunities=opportunities[:3],
        threats=threats[:3],
        recommended_improvements=improvements[:3],
    )


def _fallback_suggested_links(box_contents: dict[int, str], body: AiAnalyzeRequest) -> list[SuggestedLinkPair]:
    existing: set[tuple[int, int]] = set()
    for box in body.boxes:
        for raw_link in box.lines:
            try:
                other = int(raw_link)
            except (TypeError, ValueError):
                continue
            pair = (box.id, other) if box.id < other else (other, box.id)
            existing.add(pair)

    candidates: list[tuple[int, int, int]] = []
    usable = [(box_id, content) for box_id, content in sorted(box_contents.items()) if not _is_placeholder_box(content)]
    for index, (a, a_content) in enumerate(usable):
        a_tokens = _content_tokens(a_content)
        a_family = _opening_family(a_content)
        for b, b_content in usable[index + 1 :]:
            pair = (a, b) if a < b else (b, a)
            if pair in existing:
                continue
            b_tokens = _content_tokens(b_content)
            score = len(a_tokens & b_tokens)
            if a_family and a_family == _opening_family(b_content):
                score += 3
            if score <= 0 and len(usable) <= 6:
                score = 1
            if score > 0:
                candidates.append((score, pair[0], pair[1]))
    candidates.sort(key=lambda item: (-item[0], item[1], item[2]))
    return [
        SuggestedLinkPair(a=a, a_content=box_contents.get(a, ""), b=b, b_content=box_contents.get(b, ""))
        for _, a, b in candidates[:8]
    ]


def _fallback_see_also(body: AiAnalyzeRequest, concepts: list[str]) -> list[ExternalLink]:
    text = _note_text_for_fallback(body, {b.id: b.content for b in body.boxes}).lower()
    if "chess" in text or "opening" in text or {"e4", "d4", "c4", "nf3"} & {c.lower() for c in concepts}:
        return [
            ExternalLink(favicon="♟️", title="Wikipedia: Chess opening", url="https://en.wikipedia.org/wiki/Chess_opening"),
            ExternalLink(favicon="L", title="Lichess: Openings", url="https://lichess.org/opening"),
            ExternalLink(favicon="C", title="Chess.com: Chess Openings", url="https://www.chess.com/openings"),
        ]
    if concepts:
        query = "+".join(re.sub(r"[^A-Za-z0-9 ]+", "", concept).strip().replace(" ", "+") for concept in concepts[:3])
        if query:
            return [
                ExternalLink(favicon="W", title=f"Wikipedia search: {concepts[0]}", url=f"https://en.wikipedia.org/w/index.php?search={query}"),
            ]
    return []


def _fallback_structured_output(
    text: str, body: AiAnalyzeRequest, box_contents: dict[int, str]
) -> AiAnalyzeOut:
    overview = _fallback_overview(body, box_contents, text)
    study_analysis = _fallback_study_analysis(body, box_contents)
    concepts = _fallback_concepts(body, box_contents)
    suggested_links = _fallback_suggested_links(box_contents, body)
    see_also = _fallback_see_also(body, concepts)
    return AiAnalyzeOut(
        status="ok",
        message="TreeNotes generated a structured analysis from the note content because the model returned unparseable JSON.",
        overview=overview,
        study_analysis=study_analysis,
        analysis=_structured_to_analysis_text(overview, study_analysis),
        concepts=concepts,
        suggested_links=suggested_links,
        see_also=see_also,
        videos=[],
    )


def _build_structured_output(
    text: str, body: AiAnalyzeRequest, box_contents: dict[int, str]
) -> AiAnalyzeOut:
    if not text or not text.strip():
        return _fallback_structured_output("", body, box_contents)
    data = _extract_json_object(text)
    if data is None:
        return _fallback_structured_output(text, body, box_contents)
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


def _effective_provider(body: AiAnalyzeRequest) -> str:
    requested_provider = body.llm_provider
    p = (requested_provider or settings.ai_provider or "auto").strip().lower()
    if p == "auto":
        if (body.gemini_api_key or settings.gemini_api_key).strip():
            return "gemini"
        if (body.openai_api_key or settings.openai_api_key).strip():
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
    prov = _effective_provider(body)
    model_override = _requested_model(body, prov)
    gemini_key = (body.gemini_api_key or settings.gemini_api_key).strip()
    openai_key = (body.openai_api_key or settings.openai_api_key).strip()
    ollama_base_url = (body.ollama_base_url or settings.ollama_base_url).strip()
    box_contents = {b.id: b.content for b in body.boxes}
    if prov == "placeholder":
        return AiAnalyzeOut(
            status="placeholder",
            message="AI is not enabled. Add a Gemini/OpenAI API key in AI Settings, set one on the server, or use AI_PROVIDER=ollama.",
            analysis="",
        )
    if prov == "gemini":
        if not gemini_key:
            return AiAnalyzeOut(
                status="error",
                message="Gemini selected but no Gemini API key is available.",
                analysis="",
            )
        try:
            text = _gemini_generate(_build_prompt(body), model_override, gemini_key)
        except Exception as e:
            return AiAnalyzeOut(status="error", message=str(e)[:800], analysis="")
        return _build_structured_output(text, body, box_contents)
    if prov == "openai":
        if not openai_key:
            return AiAnalyzeOut(
                status="error",
                message="OpenAI selected but no OpenAI API key is available.",
                analysis="",
            )
        try:
            text = _openai_generate(_build_prompt(body), model_override, openai_key)
        except Exception as e:
            return AiAnalyzeOut(status="error", message=str(e)[:800], analysis="")
        return _build_structured_output(text, body, box_contents)
    if prov == "ollama":
        try:
            text = _ollama_generate(_build_prompt(body), model_override, ollama_base_url)
        except Exception as e:
            return AiAnalyzeOut(status="error", message=str(e)[:800], analysis="")
        return _build_structured_output(text, body, box_contents)
    return AiAnalyzeOut(status="placeholder", message="Unknown AI_PROVIDER.", analysis="")
