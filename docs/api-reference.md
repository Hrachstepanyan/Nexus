# API Reference

Base URL: `http://localhost:3000` (TypeScript Client)

## Health

### GET /health

Check service health status.

**Response:**
```json
{
  "typescript_service": "healthy",
  "python_service": "healthy",
  "timestamp": "2024-01-20T10:00:00Z"
}
```

## Brains

### POST /api/brains

Create a new brain.

**Request Body:**
```json
{
  "name": "string (required, 1-100 chars)",
  "description": "string (optional, max 500 chars)",
  "llm_provider": "anthropic | openai | mistral (default: anthropic)",
  "model": "string (default: claude-3-5-sonnet-20241022)"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string | null",
  "llm_provider": "string",
  "model": "string",
  "document_count": 0,
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### GET /api/brains

List all brains.

**Response (200):**
```json
{
  "brains": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string | null",
      "llm_provider": "string",
      "model": "string",
      "document_count": 0,
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ],
  "total": 0
}
```

### GET /api/brains/:id

Get brain details.

**Response (200):**
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string | null",
  "llm_provider": "string",
  "model": "string",
  "document_count": 0,
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

**Errors:**
- 404: Brain not found

### DELETE /api/brains/:id

Delete a brain.

**Response (204):**
No content

**Errors:**
- 404: Brain not found

### POST /api/brains/:id/documents

Upload documents to a brain.

**Note:** Currently requires direct access to Python service.

Use Python service endpoint:
```bash
POST http://localhost:8000/brains/:id/documents
Content-Type: multipart/form-data

files: [file1, file2, ...]
```

**Response (201):**
```json
{
  "message": "Successfully uploaded N document(s)",
  "files": ["filename1.pdf", "filename2.txt"],
  "brain_id": "uuid"
}
```

### POST /api/brains/:id/query

Query a brain with a question.

**Request Body:**
```json
{
  "question": "string (required, 1-2000 chars)",
  "max_tokens": "number (100-4096, default: 1024)",
  "temperature": "number (0-1, default: 0.7)"
}
```

**Response (200):**
```json
{
  "answer": "string",
  "sources": ["string"],
  "tokens_used": "number | null",
  "processing_time_ms": 1234
}
```

**Errors:**
- 404: Brain not found
- 400: Brain has no documents

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "detail": "Optional detailed information",
  "request_id": "uuid (optional)"
}
```

**Status Codes:**
- 400: Bad Request (validation error)
- 404: Not Found
- 500: Internal Server Error
- 503: Service Unavailable

## Rate Limits

No rate limiting currently implemented. Recommended for production:
- 100 requests/minute per IP
- 10 concurrent requests per brain query

## Python Service Direct Access

Base URL: `http://localhost:8000`

Interactive documentation available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
