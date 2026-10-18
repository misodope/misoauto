---
name: create-pr
description: Creates a pull request with the current changes.
---

# Create Pull Request

Create a pull request for the current changes using the following workflow.

## Requirements

- Use conventional commit format: `feat: [TICKET-NUM] [description]` or `fix: [TICKET-NUM] [description]` etc.
    - If ticket number doesn’t exist just omit it.
- Create a new branch if not already on one
- Follow the PR template below
- Use GitHub CLI (`gh pr create`) or GitHub MCP — it will auto-detect the correct repository

## PR Template

### Summary

Use bullet points to summarize main changes. Vary action words (implement, define, configure, switch, etc.) instead of repetitive "Add". Keep language concise without fluff words.

### Test Plan

Use bullet points to describe how changes were tested. Focus on key testing aspects like automated tests, verification steps, or manual testing performed.

## Steps

1. Review current git status, changed files, and recent commit history
2. Determine the following from context:
    - **Branch name**: Derive from the ticket number and change description (e.g., `feat/TIX-240-add-pagination`)
    - **Ticket number**: Extract from existing branch name, commit messages, or file changes, if it doesn’t exist just omit it.
    - **Commit message**: Infer from the diff — summarize what changed at a high level
    - **PR description**: Generate from the code changes using the template above
3. Create branch (if needed), commit with conventional format, push with `fgp`, and create PR
4. Use concise bullet points with varied action words in PR description

## Example PR Format

```
## Summary
- Switch `endpoint` from cursor-based to limit-offset pagination
- Define new `GraphQLType` using `PageInfo`
- Integrate `UtilityClass` for data processing
- Configure resolver functions with authorization

## Test Plan
- Updated test suite for new endpoints
- Verified success and error scenarios
- Confirmed authorization behavior
```

## Notes

- GitHub CLI automatically detects the repository from git remotes — no need to specify repo name
- Check what the current branch is branched from and create PRs into that respective branch (base branch defaults to master)
- Use `fgp` command to push instead of `git push -u origin branch-name` , only if the command exists. Otherwise just use gh cli or git
- Keep descriptions concise and avoid unnecessary words
- Use varied action verbs to prevent repetition
- Avoid overly detailed descriptions — high-level main changes only
