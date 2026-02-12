---
name: fix-bug
description: Debug and fix a bug systematically
disable-model-invocation: true
---

Fix bug: $ARGUMENTS

Follow this systematic debugging workflow:

1. **Reproduce the issue**
   - Understand the expected vs actual behavior
   - Find the minimal steps to reproduce
   - Note any error messages or logs

2. **Locate the problem**
   - Use grep/glob to find relevant code
   - Check git history: `git log -p --all -S "keyword"` to see when code changed
   - Review related files and dependencies
   - Add logging/debugging statements if needed

3. **Root cause analysis**
   - Identify WHY the bug exists, not just WHERE
   - Check for edge cases being missed
   - Look for assumptions that don't hold
   - Consider race conditions or timing issues

4. **Implement the fix**
   - Write the minimal change that fixes the root cause
   - Don't suppress errors - fix the underlying issue
   - Update validation if inputs weren't being checked
   - Add error handling if it was missing

5. **Verify the fix**
   - Test the reproduction steps - bug should be gone
   - Test edge cases to ensure no regression
   - Run linting and type checking
   - Check that existing functionality still works

6. **Prevent recurrence**
   - Add a test that would have caught this bug
   - Update documentation if behavior was unclear
   - Add input validation if that was the issue

7. **Commit**
   - Use format: `fix: <brief description of bug>`
   - Body should explain the root cause and solution
