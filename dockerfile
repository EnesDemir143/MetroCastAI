FROM python:3.12-slim

RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip

WORKDIR /app
COPY requirements.prod.txt .
RUN pip install --no-cache-dir -r requirements.prod.txt

COPY src/ ./src/

EXPOSE 8000
CMD ["python", "src/app/main.py"]