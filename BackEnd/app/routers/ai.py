from fastapi import APIRouter

from app.ai_analyze import run_ai_analyze
from app.ai_coach import run_ai_coach
from app.schemas import AiAnalyzeOut, AiAnalyzeRequest, AiCoachOut

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/analyze", response_model=AiAnalyzeOut)
def analyze_note(body: AiAnalyzeRequest) -> AiAnalyzeOut:
    """Analyze Cornell note via Gemini, OpenAI, server-side Ollama, or placeholder."""
    return run_ai_analyze(body)


@router.post("/coach", response_model=AiCoachOut)
def coach_note(body: AiAnalyzeRequest) -> AiCoachOut:
    """Generate low-stakes Coach Mode study puzzles from Cornell notes."""
    return run_ai_coach(body)
