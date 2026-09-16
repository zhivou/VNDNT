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
│   │   ├── .auth/                 saved sessions, one <username>.json per user. Only its .gitignore is committed
│   │   ├── components/            UI that repeats across pages (header, product card, cart row)
│   │   ├── data-models/           types, oracles (*.oracle.ts: the data the site is meant to show), builders
│   │   ├── fixtures/              pages.fixture.ts: page objects and fillCart as fixtures, re-exports expect
│   │   ├── pages/                 page objects: locators and user-level actions
│   │   ├── setup/                 *.setup.ts for the setup projects (precondition, auth)
│   │   ├── tests/                 *.spec.ts, plus seed.spec.ts for the test agents
│   │   ├── utils/                 env access and generic helpers
│   │   └── playwright.config.ts   extends the global config
│   └── api/                       JSONPlaceholder, no browser
│       ├── .auth/                 empty until the API needs saved auth. Only its .gitignore is committed
│       ├── clients/               one class per resource, returns the raw APIResponse
│       ├── data-models/           Zod schemas (types inferred from them) and builders
│       ├── fixtures/              clients.fixture.ts: clients as fixtures, expect with toMatchSchema
│       ├── setup/                 *.setup.ts for the setup project
│       ├── tests/                 *.spec.ts
│       ├── utils/                 env access, custom matchers
│       └── playwright.config.ts   extends the global config
├── .claude/agents/                Playwright test agents: planner, generator, healer
├── artifacts/                     gitignored brainstorm pages
├── docs/                          guidelines and prompt log
├── specs/                         Markdown test plans written by the planner agent
├── .env.example                   copy to .env before the first run
├── .mcp.json                      the agents' Playwright test MCP server, pointed at apps/ui
├── eslint.config.mjs
├── playwright.config.ts           global: shared settings, runs no tests
└── tsconfig.json                  strict mode, @ui/* and @api/* aliases
```

### Configs

- The root `playwright.config.ts` loads `.env` and exports `baseConfig`: parallelism, retries, reporters, timeouts, trace, screenshots and output folders. Its default export ignores all tests, so never run it directly.
- Each app config is `defineConfig(baseConfig, { ... })` and adds only what is specific to its service: `use` (base URL, device, headers) and `projects`. Don't repeat a global setting in an app config. If every app needs a change, make it in `baseConfig`.
- `defineConfig` merges `use` and `expect` key by key, merges `projects` by name, and lets any other top-level key in the app config replace the base value.
- Projects: each project sets its own `testDir`, `./setup` for setup projects and `./tests` for specs. Leave `testDir` out of the top level of an app config.
  - UI: `precondition` → `auth` → `chromium` → `session-end`. The first three each run only if the one before it passed. `session-end` is the teardown of `auth`, so it runs once `chromium` has finished, even if tests failed.
    - `precondition` (`setup/precondition.setup.ts`) checks that the base URL responds. Add any other check that must pass before a login here.
    - `auth` (`setup/auth.setup.ts`) logs in every user in `SESSION_USERS` through the login page and saves each session with `createStorageStateUI` to `apps/ui/.auth/<username>.json`. That's every user except `locked_out_user`, which SauceDemo refuses. SauceDemo has no login API, so the UI is the only way to get a session.
    - `chromium` runs the specs logged in as `standard_user`. A spec switches user with `test.use({ storageState: storageStatePath(SAUCE_USERS.problem) })`, and tests that start logged out use `test.use({ storageState: emptyStorageState })`.
    - SauceDemo keeps the cart only in localStorage. A test that needs products in the cart calls `fillCart([CATALOG.backpack, ...])` before opening a page, instead of clicking Add to cart. Click through the UI only when adding or removing is what the test checks.
    - A SauceDemo session lasts 10 minutes (the `session-username` cookie), so a saved session only outlives the run that made it by a few minutes.
    - `session-end` runs `tests/session-end.spec.ts` last, one test at a time (`workers: 1`). Every test shares the saved sessions, one per user, and there are no more users to create. A test that ends a session (logging out, clearing cookies) could log out every other test using that user, so it goes in `session-end.spec.ts`, never in a `chromium` spec. `chromium` ignores that file.
  - API: `setup` (`setup/health.setup.ts`) checks that the API responds, then `api` runs the specs.
- Each app writes its own `test-results/` and `playwright-report/` inside its folder. Keep `outputDir` and the reporter output paths explicit in `baseConfig`. Left to Playwright's defaults, both apps would write to the repo root and overwrite each other.

### Rules

- **Apps never import from each other.** Nothing in `apps/ui` imports `@api/*`, and nothing in `apps/api` imports `@ui/*`. If both apps ever need the same helper, add a root `shared/` folder at that point.
- Import within an app through its alias (`@ui/...`, `@api/...`). App config files use relative imports.
- Specs import `test` and `expect` from their app's fixture file, not from `@playwright/test`.
- Don't tag tests (`{ tag: '@smoke' }`). To run part of a suite, pick an app, a project or a spec file.
- Read environment variables only through the app's `utils/env.ts`, and add every new variable to `.env.example`.
- Layers within an app. Imports only go down this table:

  | Folder | Can import (same app only) | Never contains |
  |---|---|---|
  | `tests/`, `setup/` | `fixtures/`, `data-models/`, `utils/` | Selectors, URLs, credentials, `new SomePage(page)` |
  | `fixtures/` | `pages/` or `clients/`, `data-models/`, `utils/` | Test logic, or assertions beyond "setup worked" |
  | `pages/` (UI) | `components/`, `data-models/`, `utils/` | Assertions (except a small `expectLoaded()`), waits, sleeps |
  | `components/` (UI) | `data-models/`, `utils/` | Navigation, or knowledge of the page around them |
  | `clients/` (API) | `data-models/`, `utils/` | Assertions, or unwrapped responses |
  | `data-models/` | `utils/` | Playwright imports, shared mutable state |
  | `utils/` | nothing else in the app | Knowledge of a specific page or endpoint |

- File names are kebab-case with a role suffix: `*.page.ts` (`InventoryPage`), `*.component.ts` (`HeaderComponent`), `*.api.ts` (`PostsApi`), `*.fixture.ts`, `*.model.ts` (`postSchema`, `type Post`), `*.builder.ts` (`buildNewPost()`), `*.oracle.ts` (`PRODUCTS`, the expected data for a UI feature, always in `data-models/`), `*.setup.ts` (setup projects only, always in `setup/`), `*.spec.ts` (test projects only). Files in `utils/` have no suffix (`env.ts`, `auth.ts`).

### Expected data: synthetic oracles

UI tests treat SauceDemo's data as synthetic: they're written as if the test automation had seeded the store, so every expected value is known before the test runs and never read from the page.

- A feature's expected data lives in an oracle, `apps/ui/data-models/<feature>.oracle.ts`. For example, `product-catalog.oracle.ts` holds every product's id, name, description, price and image, and the order each sort option gives, and `cart.oracle.ts` holds the tax rule and works out each cart's totals.
- Write what the store is **meant** to show. SauceDemo plants mistakes on purpose for testers to find (typos, wrong prices or images, broken sorting or buttons for some users). Never copy a value from the site into an oracle without checking that it's right, and never write an expected value that matches a mistake.
- Derive expected results from the oracle's data and rules, for example sort orders from sorting the oracle's products, instead of lists copied from the page.
- Match only what the store controls. For example, the build adds a hash to image file names, so match the stable part of the name.
- When the site differs from an oracle, the test fails, and that failure is the finding. Don't make it pass by editing the oracle, loosening the assertion, or marking the test `test.fixme()`, `test.fail()` or `test.skip()`. Record the finding in the notes of the feature's plan in `specs/`.

### Adding code

- **Page or component:** add it under `apps/ui/pages/` or `apps/ui/components/`. Expose pages through `apps/ui/fixtures/pages.fixture.ts`, and compose components into pages.
- **Endpoint:** add a method to the resource's client in `apps/api/clients/`. A new resource gets a new `*.api.ts`, a fixture in `clients.fixture.ts` and a schema in `apps/api/data-models/`.
- **Service:** create `apps/<name>/` with a `playwright.config.ts` that extends `baseConfig`, an `@<name>/*` alias in `tsconfig.json` and a `test:<name>` script.

### Commands

- First run: `npm ci`, `npx playwright install chromium`, `cp .env.example .env`
- `npm run test:ui` or `npm run test:api` runs one app. Its setup projects run first.
- `npm test` runs the API app, then the UI app.
- `npm run lint` and `npm run typecheck` must pass before a PR.
- `npx playwright test -c apps/ui --project=chromium --no-deps` skips the setup projects and `session-end` and reuses the saved sessions, for local debugging. It only works within 10 minutes of the last full run.
- `npx playwright show-report apps/ui/playwright-report` opens an app's last report.

### Playwright test agents

UI tests are written with the official [Playwright test agents](https://playwright.dev/docs/test-agents). They drive a browser, so they work on `apps/ui` only.

- `playwright-test-planner` explores the site and saves a Markdown test plan to `specs/`.
- `playwright-test-generator` turns a plan scenario into a spec in `apps/ui/tests/`. It can only write inside a project's `testDir`.
- `playwright-test-healer` debugs failing tests and fixes them. A test that fails because the site differs from an oracle is a finding, not a broken test: the healer fixes only the test code (locators, steps) and leaves the oracle, the assertion and the failure alone.
- The agents call the `playwright-test` MCP server from `.mcp.json`, which runs `npx playwright run-test-mcp-server -c apps/ui`. Without `-c apps/ui` it loads the root config and finds no tests.
- The planner and generator start from `apps/ui/tests/seed.spec.ts`. It runs in `chromium`, so the setup projects run first and the page opens logged in as `standard_user` on the inventory page.
- A generated spec is a draft. Before a PR, bring it in line with the rules above (fixture imports, locators and actions in page objects) and validate it like any new test.
- After a Playwright upgrade, regenerate the agents with `npx playwright init-agents --loop=claude -c apps/ui --project=chromium`. It overwrites the agent files and `.mcp.json`, so add `"-c", "apps/ui"` back to the server args. It keeps the existing seed and `specs/`.

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
