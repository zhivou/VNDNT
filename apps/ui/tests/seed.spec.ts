import { test } from '@ui/fixtures/pages.fixture';

// Starting point for the Playwright test agents. The planner and generator run this test first and continue from
// the page it leaves open. It runs in the chromium project, so the setup projects have already run and the page is
// logged in as standard_user. It also shows the agents how specs here get their fixtures.
// eslint-disable-next-line playwright/expect-expect -- sets up state for the agents, nothing to assert
test('seed', async ({ inventoryPage }) => {
  await inventoryPage.goto();
});
