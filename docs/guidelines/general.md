# General testing practices

These rules apply to every test in this repository, UI or API. The layer-specific guides build on them:

- [UI testing practices](ui-tests.md)
- [API testing practices](api-tests.md)

## 1. Test design

**One behavior per test.** A test checks one thing and fails for one reason. If a title needs "and", split the test.

**Name tests after behavior, not steps.** A failing test's title should tell you what's broken without opening the code.

```ts
// Good
test('shows an error when the password is wrong', ...)
// Bad
test('login test 3', ...)
test('fill username, fill password, click login, check error', ...)
```

**Arrange, Act, Assert.** Set up state, perform the action, check the outcome. Keep the three parts visibly separate. For longer flows, use `test.step()` so reports read like a scenario.

**Test at the lowest layer that proves the behavior.** Check business rules, validation and data permutations with API tests. Use UI tests for user journeys and UI behavior. Don't repeat a check that already exists at the API layer through the UI.

**Cover more than the happy path.** For each feature, think about negative cases, boundary values, empty states, permissions and error handling.

**No logic in tests.** No `if`/`else`, loops over expected results, or `try`/`catch` that hides failures. A test that branches is two tests. For data-driven cases, generate one test per case:

```ts
for (const { input, error } of invalidCases) {
  test(`rejects ${input.description}`, async ({ page }) => { ... });
}
```

## 2. Isolation and determinism

- **Every test runs on its own.** It must pass alone, in any order, in parallel and repeatedly. Never rely on state left by another test.
- **Create your own data.** Each test sets up what it needs, usually through the API or fixtures, and cleans up after itself. Put cleanup in fixture teardown so it runs even when the test fails.
- **Make data unique.** Add a unique suffix (`crypto.randomUUID()`, `testInfo.workerIndex`) so parallel runs don't collide.
- **No hidden dependencies.** Avoid dependencies on the current date or time zone, on unseeded random values, or on shared accounts that other tests change.
- **Avoid `test.describe.serial`.** Use it only when a flow truly can't be split, and write down why.

## 3. Assertions

- Every test must assert something meaningful. "It didn't throw" is not an assertion.
- Assert outcomes the user or the API consumer cares about, not implementation details.
- Be specific. `toHaveText('3 items')` beats `toBeTruthy()`. Add a custom message when the matcher alone isn't clear: `expect(total, 'cart total after discount').toBe(90)`.
- Don't over-assert. Checking unrelated details makes a test fail for reasons that have nothing to do with its title.
- Use `expect.soft()` to check several independent fields in one test, so a single run reports every mismatch.

## 4. Framework structure

**Keep the layers separate.**

| Layer | Responsibility | Must not contain |
|---|---|---|
| Tests (`*.spec.ts`) | Scenario and assertions | Raw selectors, URLs, credentials |
| Page objects / API clients | How to interact with the app | Assertions about business outcomes |
| Fixtures | Wiring: create page objects and clients, set up and tear down data | Test logic |
| Test data (builders, factories) | Valid default data with easy overrides | Hard-coded shared state |
| Config (`playwright.config.ts`, env) | Base URLs, timeouts, projects, reporters | Secrets committed to git |

**Use fixtures, not globals or long `beforeEach` chains.** `test.extend()` fixtures are lazy, composable and typed, and their teardown runs even when a test fails.

```ts
import { test as base } from '@playwright/test';
import { LoginPage } from './pages/login.page';

export const test = base.extend<{ loginPage: LoginPage }>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});
export { expect } from '@playwright/test';
```

**DRY in helpers, readable in tests.** Move mechanics into page objects, clients and builders. Keep the test's intent visible in the test body, even if that repeats a line or two.

**Configuration and secrets.** Read environment-specific values from env vars and set them in the config. Commit `.env.example` and never `.env`. Never print secrets in logs, traces or reports.

## 5. Organization and execution

- Split UI and API tests into separate Playwright **projects**, so either can run alone (`--project=api`).
- Use `test.skip(condition, 'reason')` and `test.fixme('reason')` with a reason, and link a ticket when one exists. Never comment tests out.
- Set `forbidOnly: !!process.env.CI` so a stray `test.only` can't slip into CI.

## 6. Flakiness policy

- A flaky test is a bug in the test or the app. Treat it that way.
- **Never fix flakiness with sleeps, bigger timeouts or extra retries.** Find the race condition (see the waiting rules in the [UI guide](ui-tests.md#3-waiting-let-playwright-do-it)).
- Retries run only on CI (`retries: process.env.CI ? 2 : 0`). Their job is to surface flaky tests, which the report marks as "flaky", not to hide them.
- Capture traces on retry (`trace: 'on-first-retry'`) and use the Trace Viewer to investigate.
- A test you can't fix right away gets `test.fixme()` and a ticket, not an endless retry loop.

## 7. Validating a new test

Before you call a test done:

1. **See it fail.** Break the assertion, or the condition it checks, and confirm the test goes red with a clear message. A test that can't fail is worthless.
2. **Run it repeatedly:** `npx playwright test path/to.spec.ts --repeat-each=10`.
3. **Run it in parallel** with the rest of the suite.
4. **Read the report.** Step names and failure messages should make sense to someone who didn't write the test.

## 8. Code quality

- TypeScript in `strict` mode. No `any` in page objects, clients or models.
- ESLint with `@typescript-eslint/no-floating-promises` catches a missing `await`, the most common Playwright bug.
- `eslint-plugin-playwright` enforces rules such as `missing-playwright-await`, `no-wait-for-timeout`, `prefer-web-first-assertions`, `no-force-option`, `no-networkidle`, `no-focused-test` and `no-conditional-in-test`.
- Prettier for formatting, so reviews stay about logic.
- Review test code to the same standard as production code.

## 9. Reporting and debugging

- HTML reporter locally, plus a CI-friendly reporter (`list`, `junit` or `blob` for merged shards).
- `screenshot: 'only-on-failure'` and `trace: 'on-first-retry'`. A trace holds actions, DOM snapshots, network and console output in one file, which beats video.
- Debug locally with UI mode (`npx playwright test --ui`), `--debug` or the VS Code extension.

## 10. CI

- Run tests on every pull request.
- Install only the browsers you use: `npx playwright install chromium --with-deps`.
- Shard large suites across machines (`--shard=1/4`) and merge the blob reports.
- Keep `@playwright/test` up to date. New versions ship newer browsers and fixes.

## Review checklist

- [ ] The title describes the behavior, and the test checks exactly that
- [ ] It passes alone, in parallel and with `--repeat-each`
- [ ] It creates and cleans up its own data
- [ ] No sleeps, arbitrary timeouts or logic in the test body
- [ ] No raw selectors, URLs or secrets in the spec
- [ ] Assertions are specific, and you've seen them fail
- [ ] It sits in the right project
