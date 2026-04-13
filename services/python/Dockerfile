FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml ./

RUN pip install --no-cache-dir ".[data,ai]"

COPY . .

CMD ["python", "-m", "scripts.health"]
