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
| `npm run test:p1` | Only the P1 tests (see [Risk-based priorities](#risk-based-priorities)), API then UI. The setup projects still run first, and `session-end` always runs in full because it's a teardown. Its tests are all P1 |
| `npm run test:p2` | The P1 and P2 tests, API then UI |
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
- The gates run every test, whatever its priority.

## Risk-based priorities

> **Priorities were assigned after the tests were written.** The suites were automated feature by feature, without a risk-based order. The table below was added afterwards, and each test was tagged from it without any change to test logic. Likelihoods are judgment calls based on what the tests found and how the apps behave, not on production data: both are public demo apps with no usage or incident history.

Every test still runs in the QA gates. The tags let a shorter run be picked when one is needed: `npm run test:p1` for the critical risks only, or `npm run test:p2` for P1 and P2.

- **P1 critical:** the user can't log in or buy, pays the wrong amount, or a security control fails. For the API, client apps can't read data.
- **P2 important:** a main feature gives wrong results, but the user can still finish or fix it.
- **P3 low:** a convenience, or a second way to do something that has a working first way.

Likelihood is High wherever the tests already found a bug.

### UI: SauceDemo

| Feature | What breaks for the user | Likelihood | Priority |
|---|---|---|---|
| Login | The user can't log in, so they can't shop at all | Medium: login behaves differently per user (`performance_glitch_user` takes 5–6 s) | **P1** |
| Rejecting bad logins | A locked-out account, a wrong password or an empty form gets in | Low | **P1** |
| Pages need a session | The store, cart or checkout opens without logging in | Low | **P1** |
| Logout and session expiry | The next person on a shared computer is still logged in, or Back shows the store again | Medium: logout is client-side and timing-sensitive | **P1** |
| Place an order | The buyer can't complete a purchase | Medium | **P1** |
| Order totals and tax | The buyer is charged the wrong amount | High: a 4-product total isn't rounded to cents | **P1** |
| Checkout steps opened by URL | "Thank you for your order" shows for an order never placed, or placed without buyer information | High: every step opens by URL | **P1** |
| Add to cart, open the cart | The buyer can't build an order | Medium | **P1** |
| Required buyer information | Orders go through with no name or postal code, so they can't be delivered | High: fields of only spaces are accepted | P2 |
| Keeping the cart right | The cart shows or keeps the wrong products, but the buyer can see and fix it before paying | High: Checkout stays enabled for an empty cart | P2 |
| Product and order details | The buyer picks or confirms a product from wrong information | High: the Onesie description has a typo | P2 |
| Password masking | The password shows on screen | Low | P2 |
| Conveniences with another way round: sorting, image links, the Enter key, Back and Cancel buttons, dismissing errors, Reset App State, the PDF receipt | Slower or more annoying, but the task still gets done | High: Reset App State leaves stale Remove buttons | P3 |

### API: JSONPlaceholder

The user here is a client app that calls the API.

| Feature | What breaks for the user | Likelihood | Priority |
|---|---|---|---|
| Reading records: list, get, 404 for a missing id | Every client that shows data breaks, or crashes on a changed field | Low: the schemas pass | **P1** |
| Writing records: create, replace, update, delete | A save flow errors or shows the wrong response. The API saves nothing by design, so no data is lost | Low | P2 |
| Error codes for bad writes | The client gets a 500 and can't tell its own mistake from an outage | High: both known API bugs | P2 |
| Writes not persisted, PATCH merges | A write changes the shared data every client reads, or PATCH wipes fields it didn't send | Low | P2 |
| Filtering by parent id | A client shows another user's posts, albums or todos | Low | P2 |
| Nested routes (`/users/1/posts`) | Same as filtering, but the query filter still works | Low | P3 |
| Paging and sorting | Lists show the wrong slice or order. The datasets are small enough to fetch whole | Low | P3 |

### Tests per priority

| App | P1 | P2 | P3 | Total |
|---|---|---|---|---|
| UI | 44 | 33 | 23 | 100 |
| API | 18 | 64 | 34 | 116 |

- The counts include the known-bug tests. The setup projects and the agents' `seed.spec.ts` have no priority.
- UI P1 is large because the security checks run once per user, per page or per rejected login.
- Each test carries exactly one tag, `@p1`, `@p2` or `@p3`. It sits on the `test.describe` when all its tests share a priority, and on each test otherwise. Tags are used for nothing else.

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
.claude/    Claude Code agents and skills (see below)
```

### Expected data

- **UI: synthetic oracles.** The UI tests treat SauceDemo's data as synthetic, as if the test automation had seeded the store, so every expected value is known before a test runs. The expected data lives in `apps/ui/data-models/*.oracle.ts`. An oracle holds what the store is meant to show, not what the site renders today: SauceDemo plants mistakes on purpose, so a mistake is never copied into an oracle. When the site differs, the test fails, and that failure is a finding. Never change the oracle or loosen the assertion to make it pass.
- **API: types and structure.** The API tests check responses against strict Zod schemas in `apps/api/data-models/`, never against hardcoded dataset content. Ids, filter values and expected pages or sort orders come from the API at runtime. JSONPlaceholder answers writes like a real API but saves nothing, and the functional tests pin that down.

## AI agents and skills

The project was built with [Claude Code](https://claude.com/claude-code). Every prompt is in `docs/prompt-log.txt`.

### Playwright test agents

The official [Playwright test agents](https://playwright.dev/docs/test-agents) live in `.claude/agents/`. They drive a real browser through the `playwright-test` MCP server set up in `.mcp.json`, so they work on the UI app only. The API tests were written without them. The planner and generator start from `apps/ui/tests/seed.spec.ts`, which opens the store logged in as `standard_user`.

| Agent | What it does | How it was used here |
|---|---|---|
| `playwright-test-planner` | Explores the site and saves a Markdown test plan to `specs/` | Drafted all four plans: auth, product catalog, cart and checkout. Each draft was then edited by hand to follow the synthetic-data rules and match the final tests |
| `playwright-test-generator` | Turns plan scenarios into tests, checking each step in the browser | Drafted the auth, product catalog and cart tests. The drafts were rewritten to the framework's rules (fixture imports, page objects, oracles) and then deleted. The checkout tests were written without it |
| `playwright-test-healer` | Runs a failing test, debugs it and fixes the test code | Investigated the flaky logout test "does not restore the inventory page on Back". It ruled out the back-forward cache but blamed a slow app. The CI trace showed a race in the test instead, which was fixed by waiting for the login form |

Agent output is treated as a draft and reviewed by hand before it's committed.

### Skills

| Skill | What it does |
|---|---|
| `/prompt-log` | Rebuilds `docs/prompt-log.txt` from the Claude Code session transcripts. Run in every session and before each pull request |
| `/create-pr` | Checks the branch name, runs a sensitive-data scan that blocks passwords, secrets and personal data, then commits, pushes and opens or updates the pull request with a summary |

## More

- `CLAUDE.md`: the framework's layout, rules and conventions
- `docs/guidelines/`: general, UI and API testing practices
- `docs/prompt-log.txt`: every prompt used to build the project with AI assistance
