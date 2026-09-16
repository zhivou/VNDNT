---
name: create-pr
description: Create (or update) a GitHub pull request for the current work. Enforces the {first_initial}/branch-name convention and always writes a short summary of what the PR does. Use when the user runs /create-pr or asks to open, create or raise a PR.
---

# create-pr

Invoking this skill is the user's request to commit, push and open a PR for the current work. Do nothing outside these steps.

## 1. Preflight

```bash
gh auth status
git remote get-url origin
git status --short
git branch --show-current
gh repo view --json defaultBranchRef --jq .defaultBranchRef.name   # base branch, normally main
```

Stop and tell the user if `gh` isn't authenticated or there's no `origin` remote.

## 2. Branch

The branch must match `^[a-z]/[a-z0-9]+(-[a-z0-9]+)*$`, i.e. `{first_initial}/branch-name` (see `CLAUDE.md`).

- **`{first_initial}`** is the lowercase first letter of `git config user.name`.
- **On the base branch:** create a branch from the changes, e.g. `git switch -c d/api-posts-tests`. Pick a short, hyphenated name that describes the work.
- **On a branch that breaks the convention:**
  - If it isn't pushed yet, suggest a compliant name and rename it with `git branch -m <new-name>` once the user agrees.
  - If it's already pushed, stop and ask the user.
- If the user passed a branch name as an argument, use it. Validate it against the pattern first.

## 3. Commit

- Skip this step if there are no uncommitted changes.
- Stage files **by path**. Never use `git add -A` or `git add .` blindly.
- Never stage secrets or generated output: `.env*` (except `.env.example`), `.auth/`, `node_modules/`, `test-results/`, `playwright-report/`, `blob-report/`.
- If a changed file looks unrelated to the work, ask before including it.
- Commit message: one short imperative subject line (≤ 72 chars). Add a body only if the subject needs context.
- End the message with the commit attribution lines from the session instructions, if any.

## 4. Push

```bash
git push -u origin HEAD
```

## 5. Write the summary

Base the summary **only on what's in the branch**, not on the conversation:

```bash
git log --oneline <base>..HEAD
git diff --stat <base>...HEAD
git diff <base>...HEAD
```

PR body template. Keep it short, around 15 lines or fewer:

```markdown
## Summary
<1–2 sentences: what this PR does and why.>

- <key change, from the reviewer's point of view>
- <key change>
- <up to ~5 bullets; group related files, don't list every file>

## Testing
<What was run and the result, e.g. `npx playwright test --project=api`: 12 passed.
If nothing was run, say "Not run" and why (e.g. docs-only change).>
```

- Report only tests actually run in this session, with their real results. Never claim tests passed without running them.
- End the body with the PR attribution line from the session instructions, if any.
- Title: short and imperative (≤ 70 chars). No branch name, no ticket prefix unless the user gives one.

## 6. Create or update the PR

Check whether this branch already has a PR:

```bash
gh pr view --json url,state --jq '.url + " " + .state' 2>/dev/null
```

**No open PR:** create one.

```bash
gh pr create --base <base> --title "<title>" --body "$(cat <<'EOF'
<body>
EOF
)"
```

**Open PR exists:** the push already added the new commits. Rewrite the summary so it covers the whole branch:

```bash
gh pr edit --title "<title>" --body "$(cat <<'EOF'
<body>
EOF
)"
```

Open a draft (`--draft`) only when the user asks for one.

## 7. Report

Give the user:

- the PR URL
- the branch name
- the summary you wrote
