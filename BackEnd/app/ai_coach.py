"""AI Coach Mode: convert Cornell notes into low-stakes study puzzles."""

from __future__ import annotations

import ast
import json
import re
from copy import deepcopy
from typing import Any

import httpx

from app.ai_analyze import (
    _effective_provider,
    _note_text_for_fallback,
    _requested_model,
    _sanitize_concepts,
)
from app.config import settings
from app.schemas import AiAnalyzeRequest, AiCoachOut, CoachChoice, CoachPuzzle

_COACH_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "puzzles": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "type": {"type": "string", "enum": ["multiple_choice", "short_answer"]},
                    "prompt": {"type": "string"},
                    "choices": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "id": {"type": "string"},
                                "text": {"type": "string"},
                            },
                            "required": ["id", "text"],
                        },
                    },
                    "answer": {"type": "string"},
                    "acceptable_answers": {"type": "array", "items": {"type": "string"}},
                    "explanation": {"type": "string"},
                    "source_box_ids": {"type": "array", "items": {"type": "integer"}},
                },
                "required": [
                    "id",
                    "type",
                    "prompt",
                    "choices",
                    "answer",
                    "acceptable_answers",
                    "explanation",
                    "source_box_ids",
                ],
            },
        }
    },
    "required": ["puzzles"],
}


def _strict_openai_schema() -> dict[str, Any]:
    schema = deepcopy(_COACH_SCHEMA)

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


def _build_coach_prompt(body: AiAnalyzeRequest) -> str:
    box_lines: list[str] = []
    for box in sorted(body.boxes, key=lambda item: item.id):
        links = ", ".join(box.lines) if box.lines else "none"
        box_lines.append(f"Box {box.id}: {box.content or '(empty)'}\n  linked to box ids: {links}")

    return "\n".join(
        [
            "You are Coach Mode for Tree Notes: a low-stakes academic study coach.",
            "Turn the user's Cornell notes into 4-7 study puzzles for retention.",
            "Return STRICT JSON with this shape:",
            '{ "puzzles": [',
            '  { "id": "q1", "type": "multiple_choice", "prompt": "...",',
            '    "choices": [{"id": "A", "text": "..."}, {"id": "B", "text": "..."}, {"id": "C", "text": "..."}],',
            '    "answer": "A", "acceptable_answers": [],',
            '    "explanation": "Supportive explanation and why to try again if missed.",',
            '    "source_box_ids": [1, 2] },',
            '  { "id": "q2", "type": "short_answer", "prompt": "...", "choices": [],',
            '    "answer": "target answer", "acceptable_answers": ["synonym", "near answer"],',
            '    "explanation": "Supportive explanation.", "source_box_ids": [3] }',
            "] }",
            "",
            "Rules:",
            "- Make puzzles directly answerable from the notes; do not invent obscure outside facts.",
            "- Mix multiple-choice and short-answer when possible.",
            "- No punitive wording. If wrong, the user should be told to try again and given a useful explanation.",
            "- Multiple-choice questions must have 3-4 choices and answer must be one choice id.",
            "- Short-answer questions should accept concise noun phrases or one-sentence answers.",
            "- Explanations must teach the underlying idea, not merely reveal the answer.",
            "- source_box_ids must only contain existing box ids.",
            "",
            "Heading:",
            body.heading or "(none)",
            "",
            "Cue Column:",
            body.cueText or "(empty)",
            "",
            "Notes column boxes:",
            "\n".join(box_lines) if box_lines else "(empty)",
            "",
            "Summary:",
            body.summary or "(empty)",
        ]
    )


def _text_from_gemini(data: dict[str, Any]) -> str:
    chunks: list[str] = []
    for candidate in data.get("candidates") or []:
        for part in (candidate.get("content") or {}).get("parts") or []:
            text = part.get("text")
            if isinstance(text, str) and text:
                chunks.append(text)
    return "\n".join(chunks).strip()


def _text_from_openai(data: dict[str, Any]) -> str:
    if isinstance(data.get("output_text"), str):
        return data["output_text"].strip()
    chunks: list[str] = []
    for item in data.get("output") or []:
        for content in item.get("content") or []:
            text = content.get("text")
            if isinstance(text, str) and text:
                chunks.append(text)
    return "\n".join(chunks).strip()


def _generate_coach_json(prompt: str, body: AiAnalyzeRequest, provider: str, model: str) -> str:
    if provider == "gemini":
        key = (body.gemini_api_key or settings.gemini_api_key).strip()
        if not key:
            raise ValueError("Gemini selected but no Gemini API key is available.")
        chosen_model = model or settings.gemini_model
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{chosen_model}:generateContent"
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 4096,
                "responseMimeType": "application/json",
                "responseSchema": _COACH_SCHEMA,
            },
        }
        with httpx.Client(timeout=120.0) as client:
            response = client.post(url, params={"key": key}, json=payload)
            response.raise_for_status()
            return _text_from_gemini(response.json())

    if provider == "openai":
        key = (body.openai_api_key or settings.openai_api_key).strip()
        if not key:
            raise ValueError("OpenAI selected but no OpenAI API key is available.")
        payload = {
            "model": model or settings.openai_model or "gpt-5-mini",
            "input": [{"role": "user", "content": [{"type": "input_text", "text": prompt}]}],
            "max_output_tokens": 4096,
            "text": {
                "format": {
                    "type": "json_schema",
                    "name": "tree_notes_coach",
                    "strict": True,
                    "schema": _strict_openai_schema(),
                }
            },
        }
        with httpx.Client(timeout=120.0) as client:
            response = client.post(
                "https://api.openai.com/v1/responses",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json=payload,
            )
            response.raise_for_status()
            return _text_from_openai(response.json())

    if provider == "ollama":
        base = (body.ollama_base_url or settings.ollama_base_url).strip().rstrip("/")
        payload = {
            "model": model or settings.ollama_model or "llama3",
            "prompt": prompt,
            "stream": False,
            "format": "json",
        }
        with httpx.Client(timeout=120.0) as client:
            response = client.post(f"{base}/api/generate", json=payload)
            response.raise_for_status()
            return (response.json().get("response") or "").strip()

    raise ValueError("Unknown AI provider.")


def _extract_json(text: str) -> dict[str, Any] | None:
    raw = text.strip()
    candidates = [raw]
    if raw.startswith("```"):
        fenced = raw.removeprefix("```json").removeprefix("```").strip()
        if fenced.endswith("```"):
            fenced = fenced[:-3].strip()
        candidates.append(fenced)
    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end > start:
        candidates.append(raw[start : end + 1])

    for candidate in candidates:
        try:
            data = json.loads(candidate)
        except json.JSONDecodeError:
            try:
                data = ast.literal_eval(candidate)
            except (SyntaxError, ValueError):
                continue
        if isinstance(data, dict):
            return data
    return None


def _sanitize_puzzles(value: Any, body: AiAnalyzeRequest) -> list[CoachPuzzle]:
    if not isinstance(value, list):
        return []
    valid_ids = {box.id for box in body.boxes}
    puzzles: list[CoachPuzzle] = []
    for index, item in enumerate(value, start=1):
        if not isinstance(item, dict):
            continue
        puzzle_type = item.get("type")
        if puzzle_type not in {"multiple_choice", "short_answer"}:
            continue
        prompt = item.get("prompt")
        explanation = item.get("explanation")
        if not isinstance(prompt, str) or not prompt.strip():
            continue
        if not isinstance(explanation, str) or not explanation.strip():
            explanation = "Review the relevant note detail, then try again without penalty."
        source_box_ids = [
            int(box_id)
            for box_id in item.get("source_box_ids") or []
            if isinstance(box_id, int) and box_id in valid_ids
        ]
        raw_choices = item.get("choices") if isinstance(item.get("choices"), list) else []
        choices = [
            CoachChoice(id=str(choice.get("id", "")).strip(), text=str(choice.get("text", "")).strip())
            for choice in raw_choices
            if isinstance(choice, dict) and str(choice.get("id", "")).strip() and str(choice.get("text", "")).strip()
        ]
        answer = str(item.get("answer", "")).strip()
        if puzzle_type == "multiple_choice":
            choice_ids = {choice.id for choice in choices}
            if len(choices) < 2 or answer not in choice_ids:
                continue
            acceptable_answers: list[str] = []
        else:
            choices = []
            if not answer:
                continue
            acceptable_answers = [
                str(answer_item).strip()
                for answer_item in item.get("acceptable_answers") or []
                if str(answer_item).strip()
            ]
        puzzles.append(
            CoachPuzzle(
                id=str(item.get("id") or f"q{index}"),
                type=puzzle_type,
                prompt=prompt.strip(),
                choices=choices,
                answer=answer,
                acceptable_answers=acceptable_answers,
                explanation=explanation.strip(),
                source_box_ids=source_box_ids,
            )
        )
        if len(puzzles) >= 7:
            break
    return puzzles


def _fallback_puzzles(body: AiAnalyzeRequest) -> list[CoachPuzzle]:
    box_items = [(box.id, box.content.strip()) for box in body.boxes if box.content.strip() and box.content.strip().lower() != "new box"]
    concepts = _sanitize_concepts([body.heading, body.cueText, body.summary, *[content for _, content in box_items]])
    puzzles: list[CoachPuzzle] = []

    if body.summary.strip():
        puzzles.append(
            CoachPuzzle(
                id="q1",
                type="short_answer",
                prompt="Summarize the main idea of this note in one sentence.",
                answer=body.summary.strip()[:160],
                acceptable_answers=concepts[:4],
                explanation="A good answer should capture the central relationship in the notes. If your answer missed it, reread the summary and try again.",
                source_box_ids=[],
            )
        )

    if len(box_items) >= 3:
        correct_id, correct_text = box_items[0]
        choices = [
            CoachChoice(id=chr(65 + index), text=text)
            for index, (_, text) in enumerate(box_items[:4])
        ]
        puzzles.append(
            CoachPuzzle(
                id="q2",
                type="multiple_choice",
                prompt=f"Which note cell best matches this recall prompt: “{correct_text}”?",
                choices=choices,
                answer="A",
                explanation="This checks recognition of a key seed. If missed, compare the choices and try again.",
                source_box_ids=[correct_id],
            )
        )

    for index, (box_id, content) in enumerate(box_items[:4], start=3):
        puzzles.append(
            CoachPuzzle(
                id=f"q{index}",
                type="short_answer",
                prompt=f"Explain why “{content}” matters in this note.",
                answer=content,
                acceptable_answers=[content],
                explanation="Aim to explain the concept in your own words and connect it to another part of the note. Try again if your answer was only a label.",
                source_box_ids=[box_id],
            )
        )

    if not puzzles:
        text = _note_text_for_fallback(body, {box.id: box.content for box in body.boxes})
        if text:
            puzzles.append(
                CoachPuzzle(
                    id="q1",
                    type="short_answer",
                    prompt="What is the most important idea in this note?",
                    answer=(concepts[0] if concepts else text[:120]),
                    acceptable_answers=concepts[:5],
                    explanation="Coach Mode accepts close answers. If yours was vague, use a more specific term from the note and try again.",
                    source_box_ids=[],
                )
            )
    return puzzles[:7]


def run_ai_coach(body: AiAnalyzeRequest) -> AiCoachOut:
    provider = _effective_provider(body)
    if provider == "placeholder":
        return AiCoachOut(
            status="placeholder",
            message="AI is not enabled. Add a Gemini/OpenAI API key in AI Settings, set one on the server, or use AI_PROVIDER=ollama.",
            puzzles=_fallback_puzzles(body),
        )
    try:
        text = _generate_coach_json(_build_coach_prompt(body), body, provider, _requested_model(body, provider))
        parsed = _extract_json(text)
        puzzles = _sanitize_puzzles((parsed or {}).get("puzzles"), body)
        if puzzles:
            return AiCoachOut(status="ok", puzzles=puzzles)
        return AiCoachOut(
            status="ok",
            message="The model returned unusable coach JSON, so TreeNotes generated local coach puzzles.",
            puzzles=_fallback_puzzles(body),
        )
    except Exception as exc:
        return AiCoachOut(status="error", message=str(exc)[:800], puzzles=_fallback_puzzles(body))
