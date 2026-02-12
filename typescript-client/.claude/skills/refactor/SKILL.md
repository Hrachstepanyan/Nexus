---
name: refactor
description: Refactor code while maintaining functionality
disable-model-invocation: true
---

Refactor: $ARGUMENTS

Follow this safe refactoring workflow:

1. **Understand current code**
   - Read the code to be refactored thoroughly
   - Understand its purpose and all edge cases
   - Check where it's used with grep
   - Note any dependencies

2. **Define the goal**
   - What specific improvement are we making?
     - Extract duplicated logic?
     - Simplify complex functions?
     - Improve naming?
     - Better error handling?
     - Performance optimization?

3. **Plan the changes**
   - List all files that need to change
   - Identify potential breaking changes
   - Plan backwards-compatible approach if needed

4. **Implement incrementally**
   - Make one small change at a time
   - Keep functionality identical (unless explicitly changing behavior)
   - Update types/schemas if needed
   - Preserve existing error handling

5. **Verify continuously**
   - After each change, verify nothing broke
   - Run linting and type checking
   - Test the affected functionality
   - Check that all call sites still work

6. **Update documentation**
   - Update JSDoc/docstrings if signatures changed
   - Update CLAUDE.md if patterns changed
   - Note any breaking changes

7. **Commit**
   - Use format: `refactor: <what was improved>`
   - Explain the motivation in the commit body
   - Note if there are any subtle behavior changes
