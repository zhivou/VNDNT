import { SAUCE_USERS } from '@ui/data-models/sauce-user.model';
import { expect, test as setup } from '@ui/fixtures/pages.fixture';
import { env } from '@ui/utils/env';
import { storageStatePath } from '@ui/utils/storage-state';

setup('log in as standard_user', async ({ loginPage, page }) => {
  await loginPage.goto();
  await loginPage.login(SAUCE_USERS.standard, env.SAUCE_PASSWORD);
  await expect(page).toHaveURL(/\/inventory\.html$/);

  await page.context().storageState({ path: storageStatePath(SAUCE_USERS.standard) });
});
