# CLAUDE.md

Guidance for AI assistants working in this repository.

## Project

A test automation framework built with AI-assisted development for a Senior QA Engineer take-home exercise.

- **UI tests:** SauceDemo, https://www.saucedemo.com/
- **API tests:** JSONPlaceholder, https://jsonplaceholder.typicode.com/
- **Stack:** Playwright Test (`@playwright/test`) with TypeScript for both UI and API tests

## Good practices

Read the relevant guide before writing, changing or reviewing tests:

- [General testing practices](docs/guidelines/general.md): test design, isolation, assertions, framework layers, flakiness policy, code quality, CI
- [UI testing practices](docs/guidelines/ui-tests.md): locators, auto-waiting and web-first assertions, page objects, authentication, network mocking
- [API testing practices](docs/guidelines/api-tests.md): coverage per endpoint, assertions, API clients, test data and cleanup

## Branches and pull requests

- Never commit directly to `main`. Every change goes through a branch and a pull request.
- Branch names follow **`{first_initial}/branch-name`**:
  - `{first_initial}` is the lowercase first letter of the author's first name, taken from `git config user.name` (for example `d` for Dmitrii).
  - `branch-name` is a short, lowercase, hyphen-separated description of the change.
  - Pattern: `^[a-z]/[a-z0-9]+(-[a-z0-9]+)*$`
  - Good: `d/api-posts-tests`, `d/ui-login-page-object`, `d/playwright-config`
  - Bad: `feature/login`, `D/Login_Tests`, `dmitrii/api`
- Open pull requests with `/create-pr`. It enforces the branch naming and writes a short summary of what the PR does.

## Working agreements

- Do only what was asked. No commits, pushes, scaffolding or other changes nobody requested.
- The exercise requires submitting every prompt. `/prompt-log` regenerates `docs/prompt-log.txt` from the session transcripts.
