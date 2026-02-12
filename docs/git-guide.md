# Git Guide

## What to Commit

### ✅ Files Already Staged (Ready to Commit)

All source code and configuration files are staged and ready:

**Root Configuration:**
- `.env.example` - Environment template (no secrets)
- `.gitignore` - Specifies ignored files
- `package.json` - Root scripts and metadata
- `docker-compose.yml` - Container orchestration
- `README.md` - Project overview
- `CONTRIBUTING.md` - Contribution guidelines

**Documentation (6 files):**
- `docs/quickstart.md` - Getting started guide
- `docs/architecture.md` - System design
- `docs/api-reference.md` - API documentation
- `docs/examples.md` - Usage examples
- `docs/deployment.md` - Production deployment
- `docs/linting.md` - Code quality guide

**Python Service (14 files):**
- `quivr-service/src/` - All source code
- `quivr-service/Dockerfile` - Container image
- `quivr-service/.dockerignore` - Docker exclusions
- `quivr-service/.env.example` - Config template
- `quivr-service/requirements.txt` - Python dependencies
- `quivr-service/requirements-dev.txt` - Dev dependencies
- `quivr-service/pyproject.toml` - Linting configuration
- `quivr-service/.flake8` - Legacy linter config

**TypeScript Client (17 files):**
- `typescript-client/src/` - All source code
- `typescript-client/Dockerfile` - Container image
- `typescript-client/.dockerignore` - Docker exclusions
- `typescript-client/.env.example` - Config template
- `typescript-client/package.json` - Dependencies & scripts
- `typescript-client/tsconfig.json` - TypeScript config
- `typescript-client/.eslintrc.json` - Linting rules
- `typescript-client/.eslintignore` - Linting exclusions
- `typescript-client/.prettierrc` - Formatting rules

**Total: 48 files**

### ❌ Files Excluded (In .gitignore)

These files are automatically ignored and won't be committed:

**Environment & Secrets:**
- `.env` files (contain API keys - **NEVER COMMIT!**)
- `*.local` environment files

**Dependencies:**
- `node_modules/` - npm packages
- `__pycache__/` - Python bytecode
- `*.pyc, *.pyo, *.pyd` - Compiled Python

**Build Outputs:**
- `dist/` - Compiled TypeScript
- `build/` - Build artifacts
- `*.egg-info/` - Python package metadata

**Development Files:**
- `.vscode/` - VS Code settings
- `.idea/` - WebStorm/PyCharm settings (except .gitignore)
- `*.iml` - IntelliJ module files
- `*.swp, *.swo` - Vim swap files
- `.DS_Store` - macOS metadata

**Generated Data:**
- `brains_data/` - Vector storage and documents
- `*.log` - Log files
- `*.db, *.sqlite` - Databases
- `*.faiss, *.index` - Vector indices

**Other:**
- `.claude/` - Claude Code configuration
- `logs/` - Application logs

## Verification

Check what's staged:
```bash
git status --short
```

Check what's ignored:
```bash
git status --ignored
```

## Commit Command

```bash
git commit -m "feat: initial Quivr integration with comprehensive linting

- Production-grade FastAPI service with Quivr
- Type-safe TypeScript Express client
- Docker Compose setup
- Comprehensive documentation (6 guides)
- Complete linting setup (ESLint, Ruff, Black, MyPy)
- Clean architecture following SOLID principles"
```

## After Cloning

When someone clones this repo, they need to:

1. **Create environment files:**
   ```bash
   npm run setup
   ```

2. **Add API keys:**
   - Edit `quivr-service/.env`
   - Add `ANTHROPIC_API_KEY=your_key_here`

3. **Install dependencies:**
   ```bash
   npm run install:all
   ```

4. **Start services:**
   ```bash
   npm run dev
   ```

## Branch Strategy

**Recommended workflow:**

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes
# ... edit files ...

# Check what changed
git status

# Run linting before commit
npm run lint
npm run type-check

# Stage files
git add .

# Commit with conventional commit message
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/your-feature-name
```

## Conventional Commits

Use these prefixes:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style (formatting)
- `refactor:` - Code restructuring
- `perf:` - Performance improvement
- `test:` - Adding tests
- `chore:` - Maintenance tasks
- `ci:` - CI/CD changes

**Examples:**
```bash
git commit -m "feat: add document batch upload"
git commit -m "fix: handle empty brain query"
git commit -m "docs: update API reference"
git commit -m "refactor: extract storage logic"
```

## .gitignore Explained

### Why Each Pattern?

**`node_modules/`**:
- Reason: Too large, can be reinstalled with `npm install`
- Alternative: Listed in package.json

**`.env`**:
- Reason: Contains secrets (API keys)
- Alternative: Use `.env.example` as template
- **Critical**: Never commit real API keys!

**`__pycache__/`**:
- Reason: Generated Python bytecode
- Alternative: Regenerated automatically

**`dist/`**:
- Reason: Compiled code, can be rebuilt
- Alternative: Run `npm run build`

**`brains_data/`**:
- Reason: User-generated data, large files
- Alternative: Backup separately

**`.idea/`**:
- Reason: IDE-specific settings
- Exception: Some projects commit shared IDE configs
- Here: Each developer can use their own settings

## Troubleshooting

**"I accidentally committed .env!"**
```bash
# Remove from git but keep local file
git rm --cached .env
git commit -m "chore: remove .env from git"

# If already pushed, change your API keys immediately!
```

**"I want to commit IDE settings"**
```bash
# Edit .gitignore, remove .idea/ or .vscode/
# Then add specific files
git add .idea/runConfigurations/
git commit -m "chore: add run configurations"
```

**"Seeing files that should be ignored"**
```bash
# Files must be staged before .gitignore takes effect
git rm --cached <file>
git commit -m "chore: remove accidentally tracked files"
```

## Best Practices

1. ✅ **Always use `.env.example`** - Never commit real `.env`
2. ✅ **Review before committing** - Use `git status` and `git diff`
3. ✅ **Keep commits atomic** - One logical change per commit
4. ✅ **Run linters first** - `npm run check:all` before commit
5. ✅ **Write clear messages** - Future you will thank you
6. ✅ **Never force push** - Unless you're absolutely sure
7. ✅ **Pull before push** - Keep your branch up to date

## Security Checklist

Before committing, verify:

- [ ] No API keys or tokens
- [ ] No passwords or credentials
- [ ] No `.env` files (only `.env.example`)
- [ ] No personal data
- [ ] No large binary files
- [ ] No database dumps
- [ ] No security tokens

## Resources

- [Git Documentation](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Best Practices](https://docs.github.com/en/get-started/quickstart)
- [Keeping Secrets Secure](https://docs.github.com/en/code-security/getting-started/best-practices-for-preventing-data-leaks-in-your-organization)
