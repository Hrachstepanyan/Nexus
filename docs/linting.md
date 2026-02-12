# Linting & Code Quality

## Overview

This project uses industry-standard linting tools to maintain code quality:

- **TypeScript**: ESLint 9+ (Flat Config) + Prettier
- **Python**: Ruff + Black + MyPy

## ⚡ NEW: Modern ESLint Flat Config

We now support **ESLint 9+ flat config format** (`eslint.config.mjs`) with **100+ strict rules**:

- 🚀 **Better Performance**: Faster linting
- 🎯 **Stricter Type Safety**: 30+ type-aware rules
- 📦 **Cleaner Config**: Single file, better organization
- 🔮 **Future-Proof**: Modern ESLint format

**Both configs are available:**
- `eslint.config.mjs` - Modern flat config (recommended)
- `.eslintrc.json` - Legacy config (fallback for older tools)

## TypeScript Linting

### Tools

- **ESLint**: Static code analysis
- **Prettier**: Code formatting
- **TypeScript Compiler**: Type checking

### Configuration

- `.eslintrc.json` - ESLint rules
- `.prettierrc` - Prettier formatting rules
- `tsconfig.json` - TypeScript compiler options

### Commands

```bash
# From typescript-client directory
npm run lint              # Lint with flat config (modern)
npm run lint:fix          # Auto-fix issues
npm run lint:legacy       # Lint with legacy config
npm run format            # Format code
npm run format:check      # Check formatting
npm run type-check        # TypeScript type checking
npm run check             # Run all checks

# From root directory
npm run lint:ts           # Lint TypeScript
npm run lint:ts:fix       # Fix TypeScript issues
npm run format:ts         # Format TypeScript
npm run type-check:ts     # Type check TypeScript
```

### ESLint Flat Config Rules (100+ Rules)

**Modern `eslint.config.mjs` includes:**

**Strict Type Safety (30+ rules):**
- ✅ No `any` types (`@typescript-eslint/no-explicit-any`)
- ✅ No unsafe assignments (`@typescript-eslint/no-unsafe-assignment`)
- ✅ No unsafe member access (`@typescript-eslint/no-unsafe-member-access`)
- ✅ No unsafe function calls (`@typescript-eslint/no-unsafe-call`)
- ✅ No unsafe returns (`@typescript-eslint/no-unsafe-return`)
- ✅ No floating promises (`@typescript-eslint/no-floating-promises`)
- ✅ Exhaustive switch cases (`@typescript-eslint/switch-exhaustiveness-check`)
- ✅ Proper async/await (`@typescript-eslint/await-thenable`)
- ✅ Consistent type imports (`@typescript-eslint/consistent-type-imports`)

**Best Practices (40+ rules):**
- ✅ Prefer `const` over `let`
- ✅ Use optional chaining (`obj?.prop`)
- ✅ Use nullish coalescing (`value ?? default`)
- ✅ No unused imports (auto-removed)
- ✅ No unused variables (except `_` prefix)
- ✅ Prefer arrow functions
- ✅ Template literals over concatenation
- ✅ Object shorthand
- ✅ Array methods over loops

**Code Style (40+ rules):**
- ✅ 2-space indentation
- ✅ Single quotes
- ✅ Trailing commas (multiline)
- ✅ Semicolons required
- ✅ Consistent spacing
- ✅ Proper naming conventions (camelCase, PascalCase)
- ✅ No console.log (use logger)

### Legacy ESLint Rules

Our legacy `.eslintrc.json` configuration enforces:

**Type Safety:**
- No `any` types
- Strict null checks
- Proper promise handling
- Safe type assertions

**Best Practices:**
- Prefer `const` over `let`
- Use optional chaining (`?.`)
- Use nullish coalescing (`??`)
- Consistent type imports
- Proper async/await usage

**Code Quality:**
- No unused variables
- No console.log (use logger)
- Prefer arrow functions
- Consistent object shorthand
- No nested ternaries

**Error Prevention:**
- Floating promises must be awaited
- Proper error handling
- No eval or implied eval
- Atomic updates

### Example Fixes

```typescript
// ❌ Bad
const data: any = await fetch();
if (data == null) return;

// ✅ Good
const data = await fetch();
if (data === null) return;

// ❌ Bad
const value = obj && obj.prop ? obj.prop : 'default';

// ✅ Good
const value = obj?.prop ?? 'default';

// ❌ Bad
async function getData() {
  doSomething(); // floating promise
}

// ✅ Good
async function getData() {
  await doSomething();
}
```

## Python Linting

### Tools

- **Ruff**: Fast Python linter (replaces Flake8, isort, etc.)
- **Black**: Code formatter
- **MyPy**: Type checking

### Configuration

- `pyproject.toml` - Main configuration for all tools
- `.flake8` - Legacy Flake8 config (if needed)

### Commands

```bash
# From quivr-service directory
ruff check src/           # Check for issues
ruff check --fix src/     # Auto-fix issues
black src/                # Format code
black --check src/        # Check formatting
mypy src/                 # Type checking

# From root directory
npm run lint:python       # Lint Python
npm run lint:python:fix   # Fix Python issues
npm run format:python     # Format Python
npm run type-check:python # Type check Python
```

### Ruff Rules

Enabled rule categories:

- **E/W**: PEP 8 style errors and warnings
- **F**: Pyflakes (logic errors)
- **I**: Import sorting (isort)
- **C**: Comprehension improvements
- **B**: Bugbear (common bugs)
- **UP**: Pyupgrade (modern Python syntax)
- **N**: Naming conventions
- **S**: Security issues (Bandit)
- **T20**: Print statement detection
- **PT**: Pytest style
- **RET**: Return statement improvements
- **SIM**: Code simplification
- **ARG**: Unused arguments

### Example Fixes

```python
# ❌ Bad
def get_data(id):
    if id == None:
        return None
    data = {}
    data['id'] = id
    return data

# ✅ Good
def get_data(id: str | None) -> dict[str, str] | None:
    if id is None:
        return None
    return {'id': id}

# ❌ Bad
items = []
for item in data:
    if item.active:
        items.append(item.name)

# ✅ Good
items = [item.name for item in data if item.active]

# ❌ Bad
from typing import Optional
def process(value: Optional[str] = None) -> Optional[str]:
    ...

# ✅ Good (Python 3.10+)
def process(value: str | None = None) -> str | None:
    ...
```

## Pre-commit Hooks (Optional)

Install pre-commit hooks to automatically lint before commits:

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install
```

Create `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.13
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.8.0
    hooks:
      - id: mypy
        additional_dependencies: [pydantic, fastapi]

  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.56.0
    hooks:
      - id: eslint
        files: \.(ts|tsx)$
        types: [file]
```

## IDE Integration

### VS Code

**Python:**
```json
{
  "python.linting.enabled": true,
  "python.linting.ruffEnabled": true,
  "python.formatting.provider": "black",
  "python.linting.mypyEnabled": true,
  "editor.formatOnSave": true
}
```

**TypeScript:**
```json
{
  "eslint.enable": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true
}
```

### WebStorm / PyCharm

1. **ESLint**: Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint → Enable
2. **Prettier**: Settings → Languages & Frameworks → JavaScript → Prettier → Enable on save
3. **Ruff**: Settings → Tools → External Tools → Add Ruff
4. **Black**: Settings → Tools → Black → Enable on save

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/lint.yml
name: Lint

on: [push, pull_request]

jobs:
  lint-typescript:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: cd typescript-client && npm ci
      - run: cd typescript-client && npm run check

  lint-python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: 3.11
      - run: cd quivr-service && pip install -r requirements-dev.txt
      - run: cd quivr-service && ruff check src/
      - run: cd quivr-service && black --check src/
      - run: cd quivr-service && mypy src/
```

## Common Issues & Fixes

### TypeScript

**Issue**: `'X' is declared but never used`
```typescript
// Use underscore prefix for intentionally unused variables
function handler(_req: Request, res: Response) {
  res.json({ ok: true });
}
```

**Issue**: `Unsafe assignment of an 'any' value`
```typescript
// Add proper typing
const data: ApiResponse = responseSchema.parse(rawData);
```

### Python

**Issue**: `F401: Module imported but unused`
```python
# Add to __init__.py if re-exporting
from .module import Item  # noqa: F401
```

**Issue**: `S101: Use of assert detected`
```python
# Use assert only in tests, use proper validation in production code
if value is None:
    raise ValueError("Value cannot be None")
```

## Performance

- **Ruff**: ~10-100x faster than Flake8
- **ESLint**: Incremental linting in watch mode
- **MyPy**: Caching speeds up subsequent runs

## Disabling Rules

Only when absolutely necessary:

```typescript
// Single line
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = legacyFunction();

// Block
/* eslint-disable @typescript-eslint/no-explicit-any */
const data1: any = legacy1();
const data2: any = legacy2();
/* eslint-enable @typescript-eslint/no-explicit-any */
```

```python
# Single line
data: dict = legacy_function()  # type: ignore

# Block
# ruff: noqa: S101
assert value is not None
```

## Best Practices

1. **Fix warnings early** - Don't let them accumulate
2. **Run linters before commits** - Use pre-commit hooks
3. **CI must pass linting** - Block merges on failures
4. **Don't disable rules globally** - Fix the code instead
5. **Update rules regularly** - Keep tooling current
6. **Document exceptions** - Explain why rules are disabled
7. **Team alignment** - Agree on rule strictness

## Resources

- [ESLint Rules](https://eslint.org/docs/rules/)
- [TypeScript ESLint Rules](https://typescript-eslint.io/rules/)
- [Ruff Rules](https://docs.astral.sh/ruff/rules/)
- [Black Style Guide](https://black.readthedocs.io/en/stable/)
- [MyPy Documentation](https://mypy.readthedocs.io/)
