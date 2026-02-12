# Contributing Guide

## Development Setup

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose

### Initial Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd brain-2

# 2. Setup environment files
npm run setup

# 3. Add your API keys to .env files
# Edit: quivr-service/.env (add ANTHROPIC_API_KEY)
```

### Running Locally

**Option 1: Docker (Recommended)**
```bash
npm run dev
```

**Option 2: Separate Terminals**
```bash
# Terminal 1
npm run dev:python

# Terminal 2
npm run dev:ts
```

## Code Standards

### Python

- **Style**: PEP 8
- **Type hints**: Required for all function signatures
- **Docstrings**: Google style
- **Formatting**: Black (when added)
- **Linting**: Ruff (when added)

**Example:**
```python
async def create_brain(self, brain_data: BrainCreate) -> BrainResponse:
    """Create a new brain instance.

    Args:
        brain_data: Configuration for the new brain

    Returns:
        Created brain information

    Raises:
        ValueError: If brain data is invalid
    """
    pass
```

### TypeScript

- **Style**: Airbnb/Standard
- **Types**: Strict mode, no `any` types
- **Formatting**: Prettier
- **Linting**: ESLint

**Example:**
```typescript
async createBrain(brainData: BrainCreate): Promise<BrainResponse> {
  const { data } = await this.client.post('/brains', brainData);
  return BrainResponseSchema.parse(data);
}
```

## Making Changes

### Workflow

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**
   - Write code following standards
   - Add tests for new functionality
   - Update documentation

3. **Test your changes**
   ```bash
   # Python tests (when added)
   cd quivr-service
   pytest

   # TypeScript tests (when added)
   cd typescript-client
   npm test
   ```

4. **Commit**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Adding tests
- `chore:` Maintenance tasks

**Examples:**
```
feat: add document batch upload endpoint
fix: handle empty brain query gracefully
docs: update API reference with new endpoints
refactor: extract brain storage logic to service
```

## Project Structure

### Python Service

```
quivr-service/
├── src/
│   ├── config/          # Configuration management
│   ├── models/          # Pydantic models
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   ├── middleware/      # Custom middleware
│   └── main.py          # Application entry
├── tests/               # Test files (mirror src/)
└── requirements.txt     # Dependencies
```

### TypeScript Client

```
typescript-client/
├── src/
│   ├── client/          # Quivr API client
│   ├── routes/          # Express routes
│   ├── middleware/      # Express middleware
│   ├── types/           # TypeScript types
│   ├── config/          # Configuration
│   └── index.ts         # Application entry
├── tests/               # Test files
└── package.json         # Dependencies
```

## Adding New Features

### Adding a New Endpoint

**1. Python Service (FastAPI)**

```python
# src/routes/brains.py
@router.get(
    "/{brain_id}/stats",
    response_model=BrainStats,
    summary="Get brain statistics",
)
async def get_brain_stats(brain_id: UUID):
    """Get statistics for a brain."""
    stats = await brain_manager.get_stats(brain_id)
    return stats
```

**2. Add Zod Schema (TypeScript)**

```typescript
// src/types/schemas.ts
export const BrainStatsSchema = z.object({
  total_documents: z.number(),
  total_queries: z.number(),
  avg_processing_time: z.number(),
});

export type BrainStats = z.infer<typeof BrainStatsSchema>;
```

**3. Add Client Method**

```typescript
// src/client/quivr-client.ts
async getBrainStats(brainId: string): Promise<BrainStats> {
  const { data } = await this.client.get(`/brains/${brainId}/stats`);
  return BrainStatsSchema.parse(data);
}
```

**4. Add Route**

```typescript
// src/routes/brains.ts
brainsRouter.get(
  '/:id/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await quivrClient.getBrainStats(req.params.id);
    res.json(stats);
  })
);
```

**5. Update Documentation**

- Add to API reference
- Add usage example
- Update CHANGELOG

## Testing

### Writing Tests

**Python (pytest):**
```python
# tests/test_brain_manager.py
import pytest
from src.services.brain_manager import BrainManager

@pytest.fixture
def brain_manager():
    return BrainManager()

async def test_create_brain(brain_manager):
    brain_data = BrainCreate(name="Test Brain")
    brain = await brain_manager.create_brain(brain_data)
    assert brain.name == "Test Brain"
```

**TypeScript (Vitest/Jest):**
```typescript
// tests/client.test.ts
import { describe, it, expect } from 'vitest';
import { QuivrClient } from '../src/client/quivr-client';

describe('QuivrClient', () => {
  it('should create a brain', async () => {
    const client = new QuivrClient();
    const brain = await client.createBrain({
      name: 'Test Brain',
    });
    expect(brain.name).toBe('Test Brain');
  });
});
```

## Documentation

### Updating Docs

When adding features, update:
- `docs/api-reference.md` - API endpoints
- `docs/examples.md` - Usage examples
- `docs/architecture.md` - Architectural changes
- `README.md` - Major features

### Writing Good Documentation

- Use clear, concise language
- Include code examples
- Explain the "why", not just the "what"
- Update examples when APIs change

## Pull Request Process

1. **Update Documentation**
   - API reference if endpoints changed
   - Examples if usage changed
   - README if major features added

2. **Add Tests**
   - Unit tests for new functions
   - Integration tests for new endpoints
   - Ensure existing tests pass

3. **Code Review**
   - Address reviewer comments
   - Keep discussions constructive
   - Be open to suggestions

4. **Merge**
   - Squash commits if many small ones
   - Use descriptive merge message

## Best Practices

### DRY (Don't Repeat Yourself)
```typescript
// ❌ Bad
async getBrain1(id: string) {
  const { data } = await this.client.get(`/brains/${id}`);
  return BrainResponseSchema.parse(data);
}

async getBrain2(id: string) {
  const { data } = await this.client.get(`/brains/${id}`);
  return BrainResponseSchema.parse(data);
}

// ✅ Good
async getBrain(id: string) {
  const { data } = await this.client.get(`/brains/${id}`);
  return BrainResponseSchema.parse(data);
}
```

### KISS (Keep It Simple, Stupid)
```typescript
// ❌ Bad: Over-engineered
class BrainServiceFactoryProviderManager {
  createFactoryProvider() {
    return new BrainServiceFactory();
  }
}

// ✅ Good: Simple and clear
const quivrClient = new QuivrClient();
```

### Single Responsibility
```python
# ❌ Bad: Doing too much
class BrainManager:
    def create_brain_and_send_email_and_log(self, data):
        brain = self.create(data)
        self.send_email(brain)
        self.log(brain)
        return brain

# ✅ Good: Single responsibility
class BrainManager:
    def create_brain(self, data):
        return self.create(data)
```

## Questions?

- Open an issue for bugs
- Start a discussion for feature requests
- Join our community chat (if available)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
