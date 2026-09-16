# VNDNT

Playwright and TypeScript tests for SauceDemo (UI) and JSONPlaceholder (API).

## Test data: synthetic oracles

The UI tests treat SauceDemo's data as synthetic. They're written as if the test automation had seeded the store, so every expected value is known before a test runs.

- The expected data lives in oracle files, `apps/ui/data-models/*.oracle.ts`. `product-catalog.oracle.ts` holds each product's id, name, description, price and image. The expected sort orders are derived from those values.
- An oracle holds what the store is meant to show, not what the site renders today. SauceDemo plants mistakes on purpose for testers to find, so a mistake is never copied into an oracle.
- When the site differs from an oracle, the test fails. That failure is a finding: report it, and don't change the oracle or loosen the assertion to make it pass.
- A test that found a real bug is marked `test.fixme()`, with a comment saying the bug needs a fix in the application, not in the test. Remove the `fixme` once the application is fixed.

## CI

Every pull request runs two QA gates in parallel, as separate checks: **API QA Gate** and **UI QA Gate** (`.github/workflows/qa-gates.yml`). The UI gate needs the `SAUCE_PASSWORD` repository secret. Each gate uploads its HTML report as an artifact.
