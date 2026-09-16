import { expect, test as setup } from '@ui/fixtures/pages.fixture';

// Checks that must pass before any user logs in. If one fails, the auth and chromium projects don't run.
setup('SauceDemo responds', async ({ request }) => {
  const response = await request.get('/');

  await expect(response).toBeOK();
});
