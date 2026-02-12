# Nexus Global Rules

## Project Context
Quivr Brain Integration platform - A production-grade RAG (Retrieval-Augmented Generation) system with TypeScript Express gateway and Python FastAPI backend using Quivr for intelligent document processing.

---

## Security Gatekeeper 🔒
- **NEVER** read or edit `.env` files - use `.env.example` for documentation only
- **NEVER** hardcode secrets, API keys, or credentials
- **NEVER** commit sensitive data (API keys, tokens, passwords)
- Always use environment variables via `ConfigService` or `env` module
- Verify `.gitignore` includes `.env`, `.env.local`, and sensitive files before committing
- When adding new secrets, update `.env.example` with placeholder values

---

## Architecture Standards 🏗️

### TypeScript Service
- **Framework:** Express with strict TypeScript
- **Validation:** Zod schemas for all API inputs/outputs
- **Client Pattern:** Axios-based client with type-safe responses
- **Error Handling:** Centralized error handler middleware
- **File Uploads:** Multer with validation (size, type, count limits)

### Python Service
- **Framework:** FastAPI with async/await
- **Validation:** Pydantic models for all requests/responses
- **Type Hints:** Required for all function signatures
- **RAG Engine:** Quivr-core for brain management and document processing
- **LLM Integration:** Anthropic Claude (with multi-LLM support planned)
- **Error Handling:** FastAPI exception handlers with proper status codes

### Design Principles
- **Separation of Concerns:** Services, routes, middleware/handlers clearly separated
- **Single Responsibility:** Each module has one clear purpose
- **DRY (Don't Repeat Yourself):** Extract common logic into reusable functions
- **KISS (Keep It Simple):** Prefer simple, readable solutions over complex abstractions
- **Type Safety:** No `any` types in TypeScript, type hints required in Python

---

## Code Quality Standards ✨

### TypeScript
- **Linting:** ESLint with strict TypeScript rules
- **Formatting:** Prettier with project config
- **Types:** Strict mode enabled, no `any` types (use `unknown` if truly needed)
- **Naming Conventions:**
  - `camelCase` for variables, functions, methods
  - `PascalCase` for classes, types, interfaces
  - `UPPER_SNAKE_CASE` for constants
- **File Structure:**
  ```
  src/
  ├── client/       # API clients
  ├── routes/       # Express routes
  ├── middleware/   # Express middleware
  ├── types/        # TypeScript types and Zod schemas
  ├── config/       # Configuration management
  └── app.ts        # Application setup
  ```

### Python
- **Style:** PEP 8 compliance
- **Linting:** Ruff for fast linting
- **Formatting:** Black for consistent code style
- **Type Checking:** mypy for static type analysis
- **Docstrings:** Google style for all public functions/classes
- **Naming Conventions:**
  - `snake_case` for variables, functions, methods
  - `PascalCase` for classes
  - `UPPER_SNAKE_CASE` for constants
- **File Structure:**
  ```
  src/
  ├── config/       # Settings and configuration
  ├── models/       # Pydantic models and schemas
  ├── routes/       # FastAPI routes
  ├── services/     # Business logic
  ├── middleware/   # Custom middleware
  └── main.py       # Application entry point
  ```

---

## Git Workflow 📝

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
<type>: <description>

[optional body]

[optional footer]
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, no logic change)
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Adding or updating tests
- `chore:` Maintenance tasks (dependencies, config)

**Examples:**
```
feat: add document batch upload endpoint
fix: handle empty brain query gracefully
docs: update API reference with streaming endpoints
refactor: extract brain storage logic to service
```

### Before Every Commit
1. Run `npm run lint` in TypeScript service
2. Run `npm run lint:python` for Python service (when venv is set up)
3. Ensure no linting errors (warnings are acceptable)
4. Verify no `.env` files or secrets are staged
5. Test the changes locally

### Branch Strategy
- `main` - Production-ready code
- `feature/<name>` - New features
- `fix/<name>` - Bug fixes
- `refactor/<name>` - Code refactoring

---

## Testing Requirements 🧪

### Current Status
- Unit tests: Planned (see ROADMAP.md)
- Integration tests: Planned
- E2E tests: Planned

### Future Requirements (when tests are added)
- Unit test coverage: >80%
- All new features must include tests
- All bug fixes must include regression tests
- Run tests before committing: `npm test`

---

## API Design Standards 🌐

### RESTful Conventions
- Use proper HTTP methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
- Use plural nouns for resources: `/brains`, `/conversations`, `/documents`
- Use kebab-case for URL paths
- Return appropriate status codes:
  - `200 OK` - Successful GET, PUT, PATCH
  - `201 Created` - Successful POST
  - `204 No Content` - Successful DELETE
  - `400 Bad Request` - Validation errors
  - `404 Not Found` - Resource not found
  - `500 Internal Server Error` - Server errors

### Request/Response Format
- Always validate inputs with Zod (TS) or Pydantic (Python)
- Return consistent error format:
  ```json
  {
    "detail": "Error message",
    "status_code": 400
  }
  ```
- Use camelCase for JSON keys (automatically handled by schemas)

---

## Documentation Standards 📚

### Code Comments
- Explain **why**, not **what** (code should be self-explanatory)
- Add JSDoc/docstrings for public APIs
- Document complex algorithms or business logic
- Keep comments up-to-date with code changes

### API Documentation
- Update `docs/api-reference.md` when adding/changing endpoints
- Include request/response examples
- Document all query parameters and request bodies

### Examples
- Add usage examples to `docs/examples.md` for new features
- Include curl commands and code snippets
- Show both success and error cases

---

## Performance Considerations ⚡

### TypeScript Service
- Use async/await for all I/O operations
- Implement request timeouts (currently 60s for LLM operations)
- Stream large responses when possible (SSE for queries)
- Use connection pooling for HTTP clients

### Python Service
- Use async/await consistently
- Avoid blocking operations in async functions
- Implement proper error handling to prevent hanging requests
- Consider caching for frequently accessed data

---

## Monitoring & Logging 📊

### Current Logging
- Console logs for development
- Error logging in exception handlers
- Request/response logging (planned)

### Future Monitoring (see ROADMAP.md)
- Prometheus metrics export
- Grafana dashboards
- Query latency tracking
- Token usage monitoring
- Error rate alerts

---

## Dependencies Management 📦

### TypeScript
- Keep `package.json` up-to-date
- Use exact versions for critical dependencies
- Audit dependencies regularly: `npm audit`
- Document breaking changes in CHANGELOG

### Python
- Use `>=` for flexible dependency versions (already configured)
- Keep `requirements.txt` and `requirements-dev.txt` separate
- Use virtual environments: `python3 -m venv venv`
- Document version constraints and reasons

---

## Deployment Checklist 🚀

### Before Deployment
- [ ] All tests passing
- [ ] No linting errors
- [ ] Environment variables documented in `.env.example`
- [ ] Database migrations applied (when PostgreSQL is added)
- [ ] API documentation updated
- [ ] CHANGELOG updated

### Docker Deployment
- Use `docker-compose.yml` for local/dev
- Use multi-stage builds for optimized images
- Never include `.env` in Docker images
- Use health checks in containers

---

## Troubleshooting 🔧

### Common Issues

**TypeScript linting warnings:**
- Acceptable: Warnings about `any` types from axios responses
- Acceptable: Console logs in entry points
- Not acceptable: Actual `any` type declarations in our code

**Python dependency conflicts:**
- Use flexible version constraints (`>=`)
- Create fresh virtual environment if issues persist
- Check compatibility with quivr-core requirements

**Docker issues:**
- Ensure ports 3000 and 8000 are available
- Check `.env` files are present (copy from `.env.example`)
- Verify Docker has enough memory (4GB+ recommended)

---

## Resources 📖

### Project Documentation
- [README.md](../README.md) - Project overview and quick start
- [ROADMAP.md](../ROADMAP.md) - Future features and timeline
- [IMPLEMENTATION_STATUS.md](../IMPLEMENTATION_STATUS.md) - Technical progress
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [docs/](../docs/) - Detailed documentation

### External References
- [Quivr Documentation](https://docs.quivr.app/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Express Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## Quick Reference Commands 🎯

```bash
# Development
npm run dev                 # Start both services (Docker)
npm run dev:python         # Start Python service only
npm run dev:ts             # Start TypeScript service only

# Code Quality
npm run lint               # Lint both services
npm run lint:python        # Lint Python code
npm run lint:ts            # Lint TypeScript code

# Testing (when added)
npm test                   # Run all tests
npm run test:python        # Run Python tests
npm run test:ts            # Run TypeScript tests

# Docker
docker-compose up          # Start all services
docker-compose down        # Stop all services
docker-compose logs -f     # View logs
```

---

**Last Updated:** 2026-02-12
**Version:** 1.0.0
