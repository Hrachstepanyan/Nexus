# Nexus - Quivr Brain Integration Platform

Production-grade RAG system: TypeScript Express gateway (port 3000) + Python FastAPI backend (port 8000) using Quivr for intelligent document processing.

---

## Project Map (WHAT)

### Repository Structure
```
quivr-service/          # Python FastAPI backend with Quivr RAG engine
├── src/routes/         # API endpoints
├── src/services/       # Business logic (brain_manager, conversation_manager)
├── src/models/         # Pydantic schemas
└── src/config/         # Settings management

typescript-client/      # TypeScript Express API gateway
├── src/routes/         # Express routes
├── src/client/         # QuivrClient (axios-based)
├── src/types/          # Zod schemas
└── src/middleware/     # Error handling, file uploads (multer)

docs/                   # API reference, examples, architecture guides
```

### Tech Stack
- **Python**: FastAPI, Quivr-core (RAG), Pydantic, Anthropic SDK
- **TypeScript**: Express, Zod validation, Axios client
- **Storage**: File-based (pgvector migration planned)
- **Deployment**: Docker Compose

---

## Purpose (WHY)

**Current Features:**
- Multi-brain RAG system with document upload/management
- Real-time streaming (SSE) query responses
- Conversation history with context-aware queries
- Brain templates (6 presets: General, Technical, Research, Legal, Support, Creative)

**Planned Features:** See `ROADMAP.md` for multi-LLM support, auth, PostgreSQL migration, Web UI

---

## Working Guidelines (HOW)

### Commands & Verification
```bash
# Development
npm run dev              # Both services (Docker)
npm run dev:python       # Python only (port 8000)
npm run dev:ts          # TypeScript only (port 3000)

# Quality Checks
npm run lint            # Lint both services
npm run lint:ts         # TypeScript linting
npm run lint:python     # Python linting (requires venv)

# Docker
docker-compose up       # Start all services
docker-compose logs -f  # View logs
```

### Security Rules (CRITICAL)
- **NEVER** read or edit `.env` files
- **NEVER** hardcode secrets/credentials
- Always verify `.gitignore` excludes secrets before commits
- Use environment variables via `env` module (TS) or settings (Python)

### Code Standards
**TypeScript:**
- Strict types, no `any` (use `unknown` if needed)
- Zod schemas for all API I/O
- Async/await for I/O operations

**Python:**
- Type hints required for all function signatures
- Pydantic models for all API I/O
- Async/await consistently

### Commit Format
Follow Conventional Commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code restructuring
- `chore:` Maintenance

---

## Finding Information

**When you need more context, read these files:**

- `@BEST_PRACTICES.md` - Workflow patterns and examples
- `@ROADMAP.md` - Planned features and timeline
- `@docs/architecture.md` - System design and patterns
- `@docs/api-reference.md` - Complete API documentation
- `@docs/examples.md` - Usage examples

**For specific guidance:**
- API conventions: See existing endpoints in `src/routes/`
- Code patterns: Search codebase for similar implementations
- Testing approach: See `ROADMAP.md` (tests planned)

---

## Special Instructions

### When Adding Endpoints
1. Check `docs/api-reference.md` for existing patterns
2. Add Pydantic (Python) or Zod (TypeScript) schemas first
3. Follow RESTful conventions (proper HTTP methods/status codes)
4. Update API documentation after implementation

### When Fixing Bugs
1. Search git history: `git log -p --all -S "keyword"`
2. Fix root cause, don't suppress errors
3. Test edge cases thoroughly

### When Refactoring
1. Understand all usages with grep/glob first
2. Make incremental changes
3. Verify after each step

---

**Linting warnings about `any` types from axios responses are acceptable. Actual `any` declarations in our code are not.**
