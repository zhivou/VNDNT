# CLAUDE.md

Guidance for AI assistants working in this repository.

## Project

A test automation framework built with AI-assisted development for a Senior QA Engineer take-home exercise.

- **UI tests:** SauceDemo, https://www.saucedemo.com/
- **API tests:** JSONPlaceholder, https://jsonplaceholder.typicode.com/
- **Stack:** Playwright Test (`@playwright/test`) with TypeScript for both UI and API tests, Zod for API schemas, ESLint with `typescript-eslint` and `eslint-plugin-playwright`

## Prompt log (required)

The exercise requires submitting every prompt, so `docs/prompt-log.txt` must stay complete.

- Run `/prompt-log` in **every session**. It regenerates `docs/prompt-log.txt` from the session transcripts.
- Run it again at the end of the session and before opening or updating a PR. The log never includes the reply being written during a run, so it's always a few messages behind.

## Good practices

Read the relevant guide before writing, changing or reviewing tests:

- [General testing practices](docs/guidelines/general.md): test design, isolation, assertions, framework layers, flakiness policy, code quality, CI
- [UI testing practices](docs/guidelines/ui-tests.md): locators, auto-waiting and web-first assertions, page objects, authentication, network mocking
- [API testing practices](docs/guidelines/api-tests.md): coverage per endpoint, assertions, API clients, test data and cleanup

The guides show generic examples. When one differs from the framework layout below (for example `tests/api` paths or `--project=api`), follow the layout.

## Framework layout

The repo holds two self-contained Playwright suites, one per service, each in its own folder under `apps/`. They share only the global config and the repo tooling.

```
.
├── apps/
│   ├── ui/                        SauceDemo, Chromium only
│   │   ├── .auth/                 gitignored, saved sessions written by the setup project
│   │   ├── components/            UI that repeats across pages (header, product card, cart row)
│   │   ├── data-models/           types, the site's fixed data, builders
│   │   ├── fixtures/              pages.fixture.ts: page objects as fixtures, re-exports expect
│   │   ├── pages/                 page objects: locators and user-level actions
│   │   ├── tests/                 *.setup.ts and *.spec.ts
│   │   ├── utils/                 env access and generic helpers
│   │   └── playwright.config.ts   extends the global config
│   └── api/                       JSONPlaceholder, no browser
│       ├── clients/               one class per resource, returns the raw APIResponse
│       ├── data-models/           Zod schemas (types inferred from them) and builders
│       ├── fixtures/              clients.fixture.ts: clients as fixtures, expect with toMatchSchema
│       ├── tests/                 *.setup.ts and *.spec.ts
│       ├── utils/                 env access, custom matchers
│       └── playwright.config.ts   extends the global config
├── artifacts/                     gitignored brainstorm pages
├── docs/                          guidelines and prompt log
├── .env.example                   copy to .env before the first run
├── eslint.config.mjs
├── playwright.config.ts           global: shared settings, runs no tests
└── tsconfig.json                  strict mode, @ui/* and @api/* aliases
```

### Configs

- The root `playwright.config.ts` loads `.env` and exports `baseConfig`: parallelism, retries, reporters, timeouts, trace, screenshots and output folders. Its default export ignores all tests, so never run it directly.
- Each app config is `defineConfig(baseConfig, { ... })` and adds only what is specific to its service: `testDir`, `use` (base URL, device, headers) and `projects`. Don't repeat a global setting in an app config. If every app needs a change, make it in `baseConfig`.
- `defineConfig` merges `use` and `expect` key by key, merges `projects` by name, and lets any other top-level key in the app config replace the base value.
- Projects:
  - UI: `setup` logs in once as `standard_user` and saves the session to `apps/ui/.auth/`. Then `chromium` runs the specs already logged in. Login tests opt out with `test.use({ storageState: { cookies: [], origins: [] } })`.
  - API: `setup` checks that the API responds, then `api` runs the specs.
- Each app writes its own `test-results/` and `playwright-report/` inside its folder. Keep `outputDir` and the reporter output paths explicit in `baseConfig`. Left to Playwright's defaults, both apps would write to the repo root and overwrite each other.

### Rules

- **Apps never import from each other.** Nothing in `apps/ui` imports `@api/*`, and nothing in `apps/api` imports `@ui/*`. If both apps ever need the same helper, add a root `shared/` folder at that point.
- Import within an app through its alias (`@ui/...`, `@api/...`). App config files use relative imports.
- Specs import `test` and `expect` from their app's fixture file, not from `@playwright/test`.
- Read environment variables only through the app's `utils/env.ts`, and add every new variable to `.env.example`.
- Layers within an app. Imports only go down this table:

  | Folder | Can import (same app only) | Never contains |
  |---|---|---|
  | `tests/` | `fixtures/`, `data-models/`, `utils/` | Selectors, URLs, credentials, `new SomePage(page)` |
  | `fixtures/` | `pages/` or `clients/`, `data-models/`, `utils/` | Test logic, or assertions beyond "setup worked" |
  | `pages/` (UI) | `components/`, `data-models/`, `utils/` | Assertions (except a small `expectLoaded()`), waits, sleeps |
  | `components/` (UI) | `data-models/`, `utils/` | Navigation, or knowledge of the page around them |
  | `clients/` (API) | `data-models/`, `utils/` | Assertions, or unwrapped responses |
  | `data-models/` | `utils/` | Playwright imports, shared mutable state |
  | `utils/` | nothing else in the app | Knowledge of a specific page or endpoint |

- File names are kebab-case with a role suffix: `*.page.ts` (`InventoryPage`), `*.component.ts` (`HeaderComponent`), `*.api.ts` (`PostsApi`), `*.fixture.ts`, `*.model.ts` (`postSchema`, `type Post`), `*.builder.ts` (`buildNewPost()`), `*.setup.ts` (setup projects only), `*.spec.ts` (test projects only).

### Adding code

- **Page or component:** add it under `apps/ui/pages/` or `apps/ui/components/`. Expose pages through `apps/ui/fixtures/pages.fixture.ts`, and compose components into pages.
- **Endpoint:** add a method to the resource's client in `apps/api/clients/`. A new resource gets a new `*.api.ts`, a fixture in `clients.fixture.ts` and a schema in `apps/api/data-models/`.
- **Service:** create `apps/<name>/` with a `playwright.config.ts` that extends `baseConfig`, an `@<name>/*` alias in `tsconfig.json` and a `test:<name>` script.

### Commands

- First run: `npm ci`, `npx playwright install chromium`, `cp .env.example .env`
- `npm run test:ui` or `npm run test:api` runs one app. Its setup project runs first.
- `npm test` runs the API app, then the UI app.
- `npm run lint` and `npm run typecheck` must pass before a PR.
- `npx playwright test -c apps/ui --no-deps` skips login and reuses the saved session, for local debugging.
- `npx playwright show-report apps/ui/playwright-report` opens an app's last report.

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
