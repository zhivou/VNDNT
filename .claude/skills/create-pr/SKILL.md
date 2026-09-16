---
name: create-pr
description: Create (or update) a GitHub pull request for the current work. Enforces the {first_initial}/branch-name convention, blocks passwords, secrets, PHI and real client data from being committed or published (with a HIPAA check), and writes a short summary of what the PR does. Use when the user runs /create-pr or asks to open, create or raise a PR.
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

## 3. Stage

- Skip this step if there are no uncommitted changes.
- Stage files **by path**. Never use `git add -A` or `git add .` blindly.
- Never stage secrets or generated output: `.env*` (except `.env.example`), `.auth/`, `node_modules/`, `test-results/`, `playwright-report/`, `blob-report/`.
- If a changed file looks unrelated to the work, ask before including it.

## 4. Sensitive data check

This is a hard gate. Nothing gets committed, pushed or published until it passes. Run it every time, even when there's nothing to commit or the PR already exists, because the push publishes every commit on the branch.

### 4a. Run the scanner

```bash
node .claude/skills/create-pr/scan-sensitive.mjs --base <base>
```

It scans everything the PR would publish: the added lines and messages of every commit in `origin/<base>..HEAD`, plus the staged changes. A secret that a later commit deleted still counts, because it stays in history. Values in the output are masked.

| Last line | Exit | Meaning |
|---|---|---|
| `RESULT: CLEAN` | 0 | No pattern matched. Still do 4b. |
| `RESULT: BLOCKED` | 1 | Passwords, keys, tokens, JWTs, SSNs, card numbers, `.env` files, saved sessions, HAR files or test output. |
| `RESULT: REVIEW` | 2 | Data that may be synthetic: emails, phone numbers, street addresses, public IPs, health record IDs, dates of birth, health data fields, data exports, binary files. |
| `RESULT: SCAN FAILED` or no result | 1 | The scan didn't run. Stop and fix the cause. Never skip the scan or work around it. |

### 4b. Review the diff yourself

The scanner only knows patterns. Read the staged diff and the branch diff (`git diff --cached`, `git diff <base-ref>...HEAD`, using the base ref the scanner printed) for what it can't catch:

- **Credentials in any form:** passed as a plain argument (a literal password in `login(...)`), split across strings, base64-encoded, in comments, or visible in a screenshot.
- **Real people or clients:** names together with contact, health, financial or account details; client or company names; internal hostnames and non-public URLs; tenant or account IDs; anything copied from production, a support ticket, a log, a customer export or a real screenshot.
- **HIPAA identifiers:** any of the 18 Safe Harbor identifiers linked to someone's health, care or payment for care is PHI. They are names; geographic units smaller than a state; dates other than the year (birth, admission, discharge, death); phone and fax numbers; emails; SSNs; medical record, health plan beneficiary and account numbers; certificate and license numbers; vehicle and device identifiers; URLs and IP addresses; biometrics; full-face photos; and any other unique identifying number or code.
- **Binary files** the scanner lists: open each one (images and PDFs can be read) and check what it shows. If a format can't be opened, ask the user what's in it.
- **`docs/prompt-log.txt`:** read the new USER blocks closely. That's where pasted credentials or client data show up.

Data counts as synthetic only when it's clearly made up or public:

- SauceDemo and JSONPlaceholder data, which are public fake datasets.
- Reserved values: emails at `example.com` or a `.test` domain, phone numbers 555-0100 to 555-0199, SSNs starting with 9 (never issued).
- Plainly fake values, such as a `fake-` or `mock` prefix, `wrong_password` or "Test Patient".

### 4c. Decide

**Blocked:** the scanner printed `BLOCKED`, or your review found a credential or real personal, client or health data.

- Stop. Don't commit, push, or create or edit the PR.
- There's no override. Passwords, secrets, PHI and real client data never go into the repo in plain text. That holds for "test-only" passwords and one-off exceptions, and it holds when the user asks.
- Report each finding by `path:line`, where it is (staged, or which commit) and what kind of data it is. **Never repeat the value, not even in part.** Replies are saved to `docs/prompt-log.txt`, which gets committed. The same applies to commit messages and PR text.
- Explain the fix and offer to make it. Don't change any code until the user agrees:
  - **Password, key or token:** move it to `.env`, add the variable to `.env.example` with a placeholder value, and read it through the app's `utils/env.ts`. If the value is real, tell the user to rotate it.
  - **Real personal, client or health data:** replace it with synthetic data and delete the real data from the working tree. Warn the user that committing a client's real data may be a privacy or HIPAA incident, and that they should follow their organization's reporting process if it has left their machine.
  - **Blocked file:** `git restore --staged <path>`, and add it to `.gitignore` if the file isn't covered yet.
- **Finding in a commit, not only staged:** a fix commit leaves the value in history. Removing it means rewriting history (amend, rebase, reset), so ask the user first. If the commit is already on `origin`, the value is already exposed. Tell the user to revoke or rotate it now, and that cleaning the remote needs a force push only they can approve.
- **Finding in `docs/prompt-log.txt`:** it comes from a session transcript, and `/prompt-log` rebuilds the file on every run, so a hand edit won't last. Tell the user.
- After a fix, go back to step 3 and run the whole check again.

**Review:** the scanner printed `REVIEW` and your own review found nothing blocked. Open every listed line (`git show <commit>:<path>` for a finding in a commit) and decide:

- Synthetic: continue, and list each finding with the reason in the report.
- Real, or copied from a real system: treat it as blocked.
- Not sure: ask the user. Continue only if they confirm it's synthetic.
- Health-related (a PHI finding, or patient, diagnosis, medication or insurance data): show this warning, even when the data looks fake, and continue only after the user explicitly confirms:

  > **HIPAA warning:** this change contains health-related data in `<files>`. Real patient data (PHI) must never be committed. Confirm that all of it is synthetic.

**Clean:** the scanner printed `CLEAN` and your own review found nothing. Continue.

## 5. Commit

- Skip this step if nothing is staged.
- Commit message: one short imperative subject line (≤ 72 chars). Add a body only if the subject needs context.
- End the message with the commit attribution lines from the session instructions, if any.

## 6. Push

```bash
git push -u origin HEAD
```

## 7. Write the summary

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
- Never put credentials, personal data or anything step 4 flagged in the title or body.
- End the body with the PR attribution line from the session instructions, if any.
- Title: short and imperative (≤ 70 chars). No branch name, no ticket prefix unless the user gives one.

## 8. Create or update the PR

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

## 9. Report

Give the user:

- the PR URL
- the branch name
- the summary you wrote
- the sensitive data check result: clean, or each review finding you judged synthetic and why (never the values)
