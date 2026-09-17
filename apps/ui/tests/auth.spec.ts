// spec: specs/auth.md
import { LOGIN_ERRORS, PROTECTED_PAGES, REJECTED_LOGINS } from '@ui/data-models/auth.model';
import { SAUCE_USERS, SESSION_USERS } from '@ui/data-models/sauce-user.model';
import { expect, test } from '@ui/fixtures/pages.fixture';
import { emptyStorageState } from '@ui/utils/auth';
import { env } from '@ui/utils/env';

test.describe('Login', () => {
  test.use({ storageState: emptyStorageState });

  for (const user of SESSION_USERS) {
    test(`${user} logs in and lands on the inventory page`, { tag: '@p1' }, async ({
      loginPage,
      inventoryPage,
      page,
    }) => {
      await loginPage.goto();

      await loginPage.login(user, env.SAUCE_PASSWORD);

      await expect(page).toHaveURL(inventoryPage.path);
      await expect(inventoryPage.title).toHaveText('Products');
    });
  }

  test('submits the login form with the Enter key', { tag: '@p3' }, async ({ loginPage, inventoryPage, page }) => {
    await loginPage.goto();
    await loginPage.fillCredentials(SAUCE_USERS.standard, env.SAUCE_PASSWORD);

    await loginPage.password.press('Enter');

    await expect(page).toHaveURL(inventoryPage.path);
    await expect(inventoryPage.title).toHaveText('Products');
  });

  test('masks the password field', { tag: '@p2' }, async ({ loginPage }) => {
    await loginPage.goto();

    await expect(loginPage.password).toHaveAttribute('type', 'password');
  });
});

test.describe('Rejected login', () => {
  test.use({ storageState: emptyStorageState });

  for (const { description, username, password, error } of REJECTED_LOGINS) {
    test(`rejects ${description}`, { tag: '@p1' }, async ({ loginPage, page }) => {
      await loginPage.goto();

      await loginPage.login(username, password);

      await expect(page).toHaveURL(loginPage.path);
      await expect(loginPage.error).toHaveText(error);
    });
  }

  test('hides the error when it is dismissed', { tag: '@p3' }, async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(SAUCE_USERS.standard, '');
    await expect(loginPage.error).toBeVisible();

    await loginPage.dismissError.click();

    await expect(loginPage.error).toBeHidden();
  });
});

test.describe('Protected pages', { tag: '@p1' }, () => {
  test.use({ storageState: emptyStorageState });

  for (const { url, path } of PROTECTED_PAGES) {
    test(`redirect ${url} to the login page without a session`, async ({ loginPage, page }) => {
      await page.goto(url);

      await expect(page).toHaveURL(loginPage.path);
      await expect(loginPage.error).toHaveText(LOGIN_ERRORS.loginRequired(path));
    });
  }
});
