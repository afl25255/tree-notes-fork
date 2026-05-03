# API image for Railway (build context = repo root). Local compose still uses BackEnd/Dockerfile.
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY BackEnd/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY BackEnd/ .

EXPOSE 8000

# Railway sets PORT; default 8000 for local docker run.
CMD ["sh", "-c", "python -m alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
