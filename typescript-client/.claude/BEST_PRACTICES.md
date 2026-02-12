# Nexus Best Practices with Claude Code

## Quick Reference

### Available Skills
Use `/skill-name` to invoke these workflows:

- `/create-endpoint <spec>` - Create new API endpoint following Nexus conventions
- `/fix-bug <description>` - Systematic debugging and fixing workflow
- `/refactor <target>` - Safe refactoring with verification steps

### Subagents
Tell Claude explicitly to use subagents:

- **code-reviewer** - "Use a subagent to review this code for security and quality issues"

### Hooks (Automatic)
These run automatically without your intervention:

- **On Edit**: TypeScript/Python files are linted after changes
- **On Stop**: Full lint and type-check runs when Claude stops

---

## Workflow Patterns

### 1. Adding New Features

**Use Plan Mode for exploration:**
```
claude (Plan Mode)
Understand how conversations work in src/routes/conversations.py
and how they're stored. I want to add conversation search.
```

**Then implement in Normal Mode:**
```
claude (Normal Mode)
/create-endpoint POST /conversations/search with query parameter
Follow the plan we created.
```

### 2. Fixing Bugs

**Systematic approach:**
```
/fix-bug Users report that document upload fails for files >10MB
```

This skill will:
- Reproduce the issue
- Locate root cause
- Implement minimal fix
- Verify with tests
- Commit with proper message

### 3. Code Review

**Before committing major changes:**
```
Use a subagent to review the changes in src/services/brain_manager.py
Focus on security, edge cases, and consistency with existing patterns.
```

The subagent reviews in isolated context without cluttering your main conversation.

### 4. Refactoring

**Safe, incremental refactoring:**
```
/refactor Extract duplicate brain validation logic in src/routes/brains.py
into a reusable validator
```

### 5. Debugging Production Issues

**With context from logs:**
```bash
# Pipe error logs directly
cat production-errors.log | claude

# Or in conversation
claude (Normal Mode)
[paste error log]
This is happening in production. Investigate and fix the root cause.
Check git history to see what changed recently.
```

---

## Context Management

### Keep Context Clean

**Clear between unrelated tasks:**
```
/clear
```

Use this frequently! A clean context produces better results than a cluttered one.

**Use subagents for investigation:**
```
Use subagents to investigate how our streaming works in src/routes/streaming.py
```

This keeps exploration out of your main context.

### When Context Gets Full

Watch the status line for context usage. When approaching limits:

1. `/compact` - Auto-summarize to free space
2. `/rewind` - Go back to a checkpoint and summarize from there
3. `/clear` - Start fresh (best for new tasks)

---

## Verification Patterns

### Always Provide Verification

❌ **Bad:**
```
Add document upload validation
```

✅ **Good:**
```
Add document upload validation. Test with:
1. Valid PDF file - should succeed
2. File >50MB - should fail with 400
3. Invalid file type (.exe) - should fail with 400
4. No file - should fail with 400
Run tests and verify all cases pass.
```

### Let Claude Verify Itself

```
Implement rate limiting middleware. After implementation:
1. Test with rapid requests - should return 429
2. Check that limits reset correctly
3. Verify legitimate users aren't blocked
4. Run the test suite and fix any failures
```

---

## Commit Workflow

### Let Claude Handle Commits

```
Review the changes, create a descriptive commit following conventional
commits format, and push to remote.
```

Claude will:
1. Check `git status` and `git diff`
2. Write conventional commit message
3. Commit with proper attribution
4. Push to remote (if configured)

### Create Pull Requests

```
Create a PR for this feature. Include:
- Summary of changes
- Testing done
- Any breaking changes
```

---

## Common Patterns

### Parallel Work

**Run multiple Claude sessions for:**
- One writes implementation, another writes tests
- One investigates issue, another works on fix
- One refactors, another reviews

### Headless Mode

**For automation:**
```bash
# Fix lint errors automatically
claude -p "Fix all linting errors in src/" --dangerously-skip-permissions

# Generate boilerplate
claude -p "Create CRUD endpoints for User model" --output-format json

# CI integration
claude -p "Review this PR for security issues" < pr-diff.txt
```

### Fan-out Pattern

**For large migrations:**
```bash
# List all files needing migration
claude -p "List all Python files in src/ that use old import style"

# Script to migrate each
for file in $(cat files.txt); do
  claude -p "Migrate $file to new import style" \
    --allowedTools "Edit,Bash(git commit *)"
done
```

---

## Troubleshooting

### Claude Not Following Instructions?

1. **CLAUDE.md too long** - Prune it, keep only essentials
2. **Context cluttered** - Run `/clear` and try again
3. **Instructions ambiguous** - Be more specific
4. **Too many failed attempts** - Start fresh with better prompt

### Linting Warnings After Edit?

- TypeScript warnings about `any` from axios are acceptable
- Console logs in entry points are acceptable
- Actual `any` declarations in our code are not acceptable

### Corrections Not Working?

After 2 corrections on same issue:
1. `/clear` to reset context
2. Write better prompt incorporating what you learned
3. Fresh start beats accumulated corrections

---

## Tips

### Start Specific, Then Iterate

❌ **Too vague:**
```
Make the app better
```

✅ **Specific:**
```
Add request logging middleware that logs:
- Request method and path
- Status code
- Response time
- User ID if authenticated
Follow the pattern in existing middleware.
```

### Reference Existing Patterns

```
Look at how upload.ts handles file validation. Create similar
validation for document processing in brain_manager.py
```

### Scope Investigations

❌ **Unbounded:**
```
Investigate the codebase
```

✅ **Bounded:**
```
Investigate only src/services/ to understand how brain storage works.
Focus on how documents are indexed.
```

---

## Project-Specific Patterns

### Adding LLM Provider

1. Explore in Plan Mode: understand existing anthropic integration
2. Create provider interface following adapter pattern
3. Implement new provider (OpenAI, Gemini, etc.)
4. Update brain creation to support provider selection
5. Test with each provider
6. Update docs

### Adding Storage Backend

1. Use subagent to investigate current file-based storage
2. Design abstraction layer for storage
3. Implement new backend (PostgreSQL + pgvector)
4. Write migration scripts
5. Test both backends
6. Document migration process

---

## Learn More

- [CLAUDE.md](./CLAUDE.md) - Project rules and standards
- [ROADMAP.md](../ROADMAP.md) - Planned features
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- Skills: `.claude/skills/` - Reusable workflows
- Agents: `.claude/agents/` - Specialized reviewers

---

**Remember:** Claude Code is most effective when you:
1. Provide verification criteria
2. Keep context clean
3. Use the right tool (skills/agents/normal mode)
4. Iterate quickly with tight feedback loops
