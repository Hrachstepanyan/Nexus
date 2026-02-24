# Quivr Brain Integration

A production-grade TypeScript application leveraging Quivr for intelligent document processing and RAG (Retrieval-Augmented Generation).

## Architecture

```
┌─────────────────────────┐
│  TypeScript Client      │  Port 3000
│  (Express)              │
└───────────┬─────────────┘
            │ REST API
            ▼
┌─────────────────────────┐
│  Python Service         │  Port 8000
│  (FastAPI + Quivr)      │
└─────────────────────────┘
```

## Features

### ✅ Currently Available
- 🧠 **Brain Management** - Create, list, delete, and manage multiple knowledge bases
- 📄 **Document Upload** - Multi-file upload with validation (PDF, TXT, MD, DOC, DOCX, CSV, JSON)
- 🗂️ **Document Management** - List, view metadata, and delete individual documents
- 💬 **Conversation History** - Full chat session management with context-aware queries
- ⚡ **Streaming Responses** - Real-time Server-Sent Events (SSE) for token-by-token streaming
- 🎨 **Brain Templates** - 6 pre-configured templates (General, Technical, Research, Legal, Support, Creative)
- 🤖 **Anthropic Claude** - Integration with Claude 3.5 Sonnet
- 🔍 **Semantic Search** - Intelligent document retrieval with RAG
- 🚀 **Production-Ready** - Comprehensive error handling and validation
- 🐳 **Docker Support** - Easy deployment with Docker Compose

### 🚧 Coming Soon (See [ROADMAP.md](./ROADMAP.md))
- 🔄 **Multi-LLM Support** - OpenAI, Gemini, Ollama integration
- 🔐 **Authentication** - JWT-based auth with role-based access control
- 🗄️ **PostgreSQL + pgvector** - Scalable persistent storage
- 🌐 **Web UI** - Modern React/Next.js interface
- 📊 **Analytics Dashboard** - Usage tracking and insights
- 🔌 **Plugin System** - Extensible architecture with integrations
- 🧪 **Testing Suite** - Comprehensive test coverage
- 🤝 **Team Collaboration** - Shared workspaces and permissions

## Quick Start

```bash
# Install dependencies
npm run install:all

# Start services (Docker)
docker-compose up

# Or run individually
npm run dev:python    # Python service on :8000
npm run dev:ts        # TypeScript client on :3000
```

## Project Structure

```
.
├── quivr-service/       # Python FastAPI service
├── typescript-client/   # TypeScript Express client
├── arbitrage-service/   # NestJS car market intelligence API
├── arbitrage-ui/        # Angular frontend for ArbitrageAuto
├── docs/               # Documentation
└── docker-compose.yml  # Container orchestration
```

---

## ArbitrageAuto AI

Car market intelligence platform built on top of the Nexus monorepo.

### Features
- **Market Data API** - Filtered, paginated car listings with real-time stats
- **Valuations** - Fair value estimates using linear regression on comparables
- **Deal Scoring** - -100 to 100 score based on price vs expected value
- **Scatter Charts** - Price vs mileage visualization with regression lines
- **Automated Scraping** - Nightly data collection with MAD outlier filtering
- **TimescaleDB** - Time-series price tracking and market aggregates

### Quick Start
```bash
npm run install:arbitrage    # Install NestJS service deps
npm run dev:arbitrage        # Start on port 4000
npm run dev:ui               # Start Angular UI on port 4200
```

### API Endpoints
- `GET /api/v1/market-data` - Filtered listings + stats
- `GET /api/v1/valuations/:vin` - VIN-specific valuation
- `GET /api/v1/valuations/estimate` - Estimate by make/model/year/mileage
- `GET /api/v1/charts/scatter` - Scatter plot data with regression
- `POST /admin/scraper/run/:source` - Manual scraper trigger

See [ArbitrageAuto API Reference](./docs/arbitrage-api-reference.md) for full documentation.

## Documentation

### User Guides
- [📚 Quick Start Guide](./docs/quickstart.md)
- [💡 Usage Examples](./docs/examples.md)
- [📖 API Reference](./docs/api-reference.md) - Also available at http://localhost:8000/docs

### Developer Resources
- [🏗️ Architecture Overview](./docs/architecture.md)
- [🗺️ Development Roadmap](./ROADMAP.md) - **Future features and timeline**
- [📋 Implementation Status](./IMPLEMENTATION_STATUS.md) - Detailed technical progress
- [✨ Linting & Code Quality](./docs/linting.md)
- [🚀 Deployment Guide](./docs/deployment.md)

## Stack

- **Python**: FastAPI, Quivr, Anthropic SDK, Pydantic
- **TypeScript**: Express, Zod, Axios, Multer
- **Storage**: File-based (pgvector migration planned - see [ROADMAP.md](./ROADMAP.md))
- **Vector Search**: Faiss (via Quivr)
- **Container**: Docker, Docker Compose

## API Endpoints

### Brains
- `POST /brains` - Create a brain
- `GET /brains` - List all brains
- `GET /brains/:id` - Get brain details
- `DELETE /brains/:id` - Delete a brain
- `POST /brains/:id/documents` - Upload documents
- `GET /brains/:id/documents` - List documents
- `DELETE /brains/:id/documents/:name` - Delete a document
- `POST /brains/:id/query` - Query a brain

### Conversations
- `POST /conversations` - Create a conversation
- `GET /conversations` - List conversations
- `GET /conversations/:id` - Get conversation details
- `DELETE /conversations/:id` - Delete conversation
- `POST /conversations/:id/query` - Query with context
- `POST /conversations/:id/messages` - Add a message

### Streaming
- `POST /stream/brains/:id/query` - Stream query response
- `POST /stream/conversations/:id/query` - Stream with context

### Templates
- `GET /templates` - List brain templates
- `GET /templates/:id` - Get template details
- `POST /templates/:id/create` - Create brain from template

**Full API documentation**: http://localhost:8000/docs (when running)

## What's Next?

We're actively developing new features! Check out our [Development Roadmap](./ROADMAP.md) to see:

- **Priority 1**: Multi-LLM support (OpenAI, Gemini, Ollama)
- **Priority 2**: Authentication & PostgreSQL migration
- **Priority 3**: Web UI with React/Next.js
- **Priority 4**: Analytics dashboard and monitoring

See [ROADMAP.md](./ROADMAP.md) for complete feature timeline and [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for technical details.

## Contributing

Want to help build the future of RAG? We welcome contributions!

1. Check [ROADMAP.md](./ROADMAP.md) for planned features
2. Read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines
3. Pick a feature or fix a bug
4. Submit a pull request

## License

MIT
