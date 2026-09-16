import { SESSION_USERS } from '@ui/data-models/sauce-user.model';
import { expect, test as setup } from '@ui/fixtures/pages.fixture';
import { createStorageStateUI } from '@ui/utils/auth';
import { env } from '@ui/utils/env';

// One login per user, in parallel. Each session is saved to .auth/<username>.json. A spec switches user with
// test.use({ storageState: storageStatePath(SAUCE_USERS.problem) })
for (const user of SESSION_USERS) {
  setup(`log in as ${user}`, async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login(user, env.SAUCE_PASSWORD);
    await expect(page).toHaveURL(/\/inventory\.html$/);

    await createStorageStateUI(page, user);
  });
}
