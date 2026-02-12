# TypeScript Client for Quivr Brain Service

Type-safe Express API client for the Quivr Brain Service.

## Features

- ✨ Full TypeScript with strict type checking
- 🔒 Runtime validation with Zod schemas
- 🚀 Clean async/await patterns
- 🎯 Zero `any` types
- 📏 Production-grade ESLint rules (100+ rules)
- 💅 Prettier code formatting

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Development
npm run dev

# Production build
npm run build
npm start
```

## Linting

We use **two ESLint configurations**:

### Modern Flat Config (Recommended)

**File**: `eslint.config.mjs`

Uses ESLint 9+ flat config format with TypeScript ESLint v7+:

```bash
npm run lint        # Lint using flat config
npm run lint:fix    # Auto-fix issues
```

**Advantages:**
- Modern, future-proof format
- Better performance
- Cleaner configuration
- 100+ strict rules for type safety

### Legacy Config (Fallback)

**File**: `.eslintrc.json`

For tools that don't support flat config yet:

```bash
npm run lint:legacy  # Lint using legacy config
```

## Scripts

```bash
npm run dev           # Start dev server with hot reload
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Lint code (flat config)
npm run lint:fix      # Auto-fix linting issues
npm run lint:legacy   # Lint with legacy config
npm run format        # Format code with Prettier
npm run format:check  # Check formatting
npm run type-check    # TypeScript type checking
npm run check         # Run all checks (type + lint + format)
```

## Project Structure

```
src/
├── client/          # Quivr API client
│   └── quivr-client.ts
├── routes/          # Express routes
│   ├── brains.ts
│   └── health.ts
├── middleware/      # Express middleware
│   ├── async-handler.ts
│   └── error-handler.ts
├── types/           # TypeScript types & Zod schemas
│   └── schemas.ts
├── config/          # Configuration
│   └── environment.ts
├── app.ts           # Express app setup
└── index.ts         # Entry point
```

## Environment Variables

```bash
PORT=3000
NODE_ENV=development
QUIVR_SERVICE_URL=http://localhost:8000
LOG_LEVEL=info
```

## API Endpoints

### Health Check
- `GET /health` - Check service health

### Brains
- `POST /api/brains` - Create a brain
- `GET /api/brains` - List all brains
- `GET /api/brains/:id` - Get brain details
- `DELETE /api/brains/:id` - Delete a brain
- `POST /api/brains/:id/query` - Query a brain

## Type Safety

All API responses are validated at runtime using Zod:

```typescript
const brain = await quivrClient.createBrain({
  name: 'My Brain',
  llm_provider: 'anthropic',
});
// brain is fully typed as BrainResponse
```

## Error Handling

Custom error class for API errors:

```typescript
try {
  const result = await quivrClient.queryBrain(id, { question });
} catch (error) {
  if (error instanceof QuivrClientError) {
    console.error(`API Error (${error.statusCode}):`, error.message);
  }
}
```

## Code Quality Rules

Our ESLint config enforces:

**Type Safety (30+ rules):**
- No `any` types
- No unsafe assignments
- Proper promise handling
- Exhaustive switch cases

**Best Practices (40+ rules):**
- Prefer `const` over `let`
- Use optional chaining
- Use nullish coalescing
- Proper async/await
- No unused imports

**Code Style (40+ rules):**
- Consistent spacing
- Proper indentation (2 spaces)
- Single quotes
- Trailing commas
- Proper naming conventions

## Contributing

1. Run checks before committing:
   ```bash
   npm run check
   ```

2. Fix issues automatically:
   ```bash
   npm run lint:fix
   npm run format
   ```

3. All checks must pass in CI

## License

MIT
