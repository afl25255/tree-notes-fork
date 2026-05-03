from fastapi import APIRouter

from app.ai_analyze import run_ai_analyze
from app.schemas import AiAnalyzeOut, AiAnalyzeRequest

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/analyze", response_model=AiAnalyzeOut)
def analyze_note(body: AiAnalyzeRequest) -> AiAnalyzeOut:
    """Analyze Cornell note via Gemini, server-side Ollama, or placeholder (see `AI_PROVIDER`)."""
    return run_ai_analyze(body)
