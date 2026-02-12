# Quick Start Guide

## Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose (optional)
- Anthropic API key

## Setup

### 1. Clone and Install

```bash
# Setup environment files
npm run setup

# Edit .env files with your API keys
# Required: ANTHROPIC_API_KEY in quivr-service/.env
```

### 2. Option A: Docker (Recommended)

```bash
# Start both services
docker-compose up --build

# Services will be available at:
# - Python Service: http://localhost:8000
# - TypeScript Client: http://localhost:3000
# - API Docs: http://localhost:8000/docs
```

### 2. Option B: Local Development

**Terminal 1 - Python Service:**
```bash
cd quivr-service
pip install -r requirements.txt
uvicorn src.main:app --reload
```

**Terminal 2 - TypeScript Client:**
```bash
cd typescript-client
npm install
npm run dev
```

## First Request

### Create a Brain

```bash
curl -X POST http://localhost:3000/api/brains \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Brain",
    "description": "Testing Quivr integration",
    "llm_provider": "anthropic",
    "model": "claude-3-5-sonnet-20241022"
  }'
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "My First Brain",
  "description": "Testing Quivr integration",
  "llm_provider": "anthropic",
  "model": "claude-3-5-sonnet-20241022",
  "document_count": 0,
  "created_at": "2024-01-20T10:00:00Z",
  "updated_at": "2024-01-20T10:00:00Z"
}
```

### Upload Documents

```bash
# Direct to Python service (TypeScript file upload coming soon)
curl -X POST http://localhost:8000/brains/{brain_id}/documents \
  -F "files=@document1.pdf" \
  -F "files=@document2.txt"
```

### Query the Brain

```bash
curl -X POST http://localhost:3000/api/brains/{brain_id}/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the main topic of the documents?",
    "max_tokens": 1024,
    "temperature": 0.7
  }'
```

Response:
```json
{
  "answer": "Based on the uploaded documents...",
  "sources": [],
  "processing_time_ms": 1234
}
```

## Health Check

```bash
# TypeScript service (includes Python service status)
curl http://localhost:3000/health

# Python service directly
curl http://localhost:8000/health
```

## Next Steps

- [API Reference](./api-reference.md)
- [Architecture Overview](./architecture.md)
- [Deployment Guide](./deployment.md)
