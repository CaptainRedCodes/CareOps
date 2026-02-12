FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

WORKDIR /app

# Copy dependency files first
COPY pyproject.toml uv.lock ./

# Install deps (uv-managed venv)
RUN uv sync --frozen --no-dev --no-install-project

# Copy app code
COPY . .

EXPOSE 8000

# Run using uv so it uses the venv
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
