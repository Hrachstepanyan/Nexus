# Architecture Overview

## System Design

```
┌─────────────────────────────────┐
│  Client Application             │
│  (Your Frontend/Service)        │
└──────────────┬──────────────────┘
               │ HTTP/REST
               ▼
┌─────────────────────────────────┐
│  TypeScript Express Client      │  Port: 3000
│  ───────────────────────────    │
│  • Request validation (Zod)     │
│  • Type-safe API client         │
│  • Error handling               │
│  • Business logic layer         │
└──────────────┬──────────────────┘
               │ HTTP/REST
               ▼
┌─────────────────────────────────┐
│  Python FastAPI Service         │  Port: 8000
│  ───────────────────────────    │
│  • Quivr integration            │
│  • Document processing          │
│  • LLM orchestration            │
│  • Vector storage               │
└──────────────┬──────────────────┘
               │
               ▼
        ┌──────────────┐
        │   Quivr      │
        │   Core       │
        └──────┬───────┘
               │
      ┌────────┴─────────┐
      ▼                  ▼
┌──────────┐      ┌──────────┐
│ Vector   │      │   LLM    │
│ Storage  │      │ Provider │
│(Faiss/PG)│      │(Anthropic)│
└──────────┘      └──────────┘
```

## Component Responsibilities

### TypeScript Express Client
- **Purpose**: Provides a TypeScript-native interface to Quivr
- **Key Features**:
  - Runtime validation with Zod
  - Type-safe API client
  - Error handling and transformation
  - Extensible for business logic
- **Tech Stack**: Express, TypeScript, Axios, Zod

### Python FastAPI Service
- **Purpose**: Core RAG engine using Quivr
- **Key Features**:
  - Document ingestion and processing
  - Brain lifecycle management
  - LLM provider integration
  - Vector storage management
- **Tech Stack**: FastAPI, Quivr, Pydantic, Anthropic SDK

### Quivr Core
- **Purpose**: RAG framework
- **Responsibilities**:
  - Document chunking and embedding
  - Semantic search
  - Context retrieval
  - LLM response generation

## Data Flow

### 1. Document Upload Flow
```
Client → TS Client → Python Service → Quivr
                                        ↓
                                   File Processing
                                        ↓
                                   Embedding
                                        ↓
                                   Vector Storage
```

### 2. Query Flow
```
Client → TS Client → Python Service → Quivr
                                        ↓
                                   Semantic Search
                                        ↓
                                   Context Retrieval
                                        ↓
                                   LLM (Anthropic)
                                        ↓
                                   Response ← ← ← ← Client
```

## Storage Architecture

### Brain Storage
```
brains_data/
├── metadata.json              # Brain metadata index
├── {brain-uuid-1}/
│   ├── document1.pdf
│   ├── document2.txt
│   └── .vector_index          # Faiss/PGVector data
└── {brain-uuid-2}/
    └── ...
```

## Scalability Considerations

### Current Limitations
- Single-instance Python service
- In-memory brain instances
- Local file storage

### Scale-Up Path
1. **Horizontal Scaling**: Load balance multiple Python service instances
2. **Database**: Replace file storage with PostgreSQL + PGVector
3. **Cache Layer**: Add Redis for frequent queries
4. **Queue System**: Celery/RQ for async document processing
5. **Object Storage**: S3/MinIO for document storage

## Security

- Helmet.js for Express security headers
- CORS configuration (development: open, production: restricted)
- Environment variable validation
- API key management via environment
- No secrets in code or logs

## Monitoring & Observability

### Current
- Request logging (Morgan)
- Error tracking with request IDs
- Health checks

### Production Recommendations
- APM (DataDog, New Relic)
- Structured logging (Winston, Pino)
- Metrics (Prometheus + Grafana)
- Distributed tracing (OpenTelemetry)
