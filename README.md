# VNDNT

Playwright and TypeScript tests for two public demo services:

- **UI:** [SauceDemo](https://www.saucedemo.com/), in Chromium
- **API:** [JSONPlaceholder](https://jsonplaceholder.typicode.com/), with Zod schemas for the responses

## Known bugs: tests that don't fail the run

Some tests fail on purpose, and the QA gates ignore them. **Every one of these tests found a real bug in the application under test.** None of them is a flaky or broken test. Each one stays in the suite, marked so the run stays green until the application is fixed:

- **UI tests** are marked `test.fixme()`. They're skipped and show as skipped in the report. A `// Real bug: ...` comment above each one says what's wrong, and the finding is written up in the Notes of the feature's plan in `specs/`.
- **API tests** are marked `test.fail()`. They still run and must fail. If the API gets fixed, Playwright reports an unexpected pass, the run goes red, and the marker has to be removed.

| App | Bug | Pinned in |
|---|---|---|
| UI | Sauce Labs Onesie's description reads "sleeved" instead of "sleeves" | `product-catalog.spec.ts` (list and details), `cart.spec.ts`, `checkout.spec.ts` (overview) |
| UI | First Name, Last Name and Zip/Postal Code accept a value of only spaces, and checkout continues | `checkout.spec.ts`, the three "only spaces" cases |
| UI | Every checkout page opens by its URL whatever state the cart is in: an order of nothing can be placed, and the information step can be skipped | `checkout.spec.ts` › Opening a checkout page by its URL |
| UI | Checkout is enabled with an empty cart | `cart.spec.ts` |
| UI | Reset App State empties the cart, but the Remove buttons and cart rows stay until the page reloads | `cart.spec.ts` › Reset App State |
| UI | The item total isn't rounded to cents for some carts, for example "$105.96000000000001" | `cart.spec.ts`, the 4-product cart |
| API | PUT on a missing id returns 500 instead of 404 | `known-bugs.spec.ts`, all six resources |
| API | POST with malformed JSON returns 500 instead of 400 | `known-bugs.spec.ts`, all six resources |

## Setup

You need Node.js 22 and npm.

```bash
npm ci
npx playwright install chromium
cp .env.example .env
```

In `.env`, set `SAUCE_PASSWORD` to the password printed on the SauceDemo login page. `.env` is git-ignored. Never commit the password.

## Running the tests

| Command | What it runs |
|---|---|
| `npm test` | The API suite, then the UI suite |
| `npm run test:api` | The API suite: the `setup` health check, then the `api` project |
| `npm run test:ui` | The UI suite: `precondition` → `auth` (logs in and saves a session per user) → `chromium` → `session-end` |
| `npx playwright test -c apps/api tests/functional/filtering.spec.ts` | One spec file. Pass `-c apps/api` or `-c apps/ui`: the root config runs no tests |
| `npx playwright test -c apps/ui --project=chromium --no-deps` | UI specs only, reusing the saved sessions. Works within 10 minutes of a full UI run |
| `npx playwright show-report apps/api/playwright-report` | The last HTML report of an app (`apps/ui/playwright-report` for the UI) |
| `npm run lint` and `npm run typecheck` | ESLint and TypeScript. Both must pass before a pull request |

## QA gates

`.github/workflows/qa-gates.yml` runs two QA gates on every pull request. They run in parallel and report as separate checks. The workflow can also be started by hand from the Actions tab.

| Gate | What it does |
|---|---|
| **API QA Gate** | Runs `npm run test:api` |
| **UI QA Gate** | Installs Chromium and runs `npm run test:ui`. It reads the SauceDemo password from the `SAUCE_PASSWORD` repository secret |

- Each gate uploads its HTML report as an artifact (`api-playwright-report`, `ui-playwright-report`), even when tests fail.
- On CI, tests get 2 retries, `test.only` fails the run, and a JUnit report is written too.
- A gate fails on any failing test. The known bugs above are pinned, so a red gate means something new broke.

## How the tests are organized

```
apps/
├── ui/     SauceDemo: page objects, components, oracles, fixtures, setup projects and specs
│   └── tests/            auth, product catalog, cart, checkout, and session-end (runs last)
└── api/    JSONPlaceholder: one client per resource, Zod schemas, builders, fixtures and specs
    └── tests/
        ├── schema/       status, headers and the strict response schema, per resource (not Pact contracts)
        └── functional/   behavior: CRUD echoes, persistence, filtering, nested routes, paging and sorting, known bugs
specs/      test plans for the UI features, with the findings in their Notes
docs/       testing guidelines and the prompt log
```

### Expected data

- **UI: synthetic oracles.** The UI tests treat SauceDemo's data as synthetic, as if the test automation had seeded the store, so every expected value is known before a test runs. The expected data lives in `apps/ui/data-models/*.oracle.ts`. An oracle holds what the store is meant to show, not what the site renders today: SauceDemo plants mistakes on purpose, so a mistake is never copied into an oracle. When the site differs, the test fails, and that failure is a finding. Never change the oracle or loosen the assertion to make it pass.
- **API: types and structure.** The API tests check responses against strict Zod schemas in `apps/api/data-models/`, never against hardcoded dataset content. Ids, filter values and expected pages or sort orders come from the API at runtime. JSONPlaceholder answers writes like a real API but saves nothing, and the functional tests pin that down.

## More

- `CLAUDE.md`: the framework's layout, rules and conventions
- `docs/guidelines/`: general, UI and API testing practices
- `docs/prompt-log.txt`: every prompt used to build the project with AI assistance
