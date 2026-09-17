// spec: specs/auth.md
import { LOGIN_ERRORS } from '@ui/data-models/auth.model';
import { SESSION_USERS } from '@ui/data-models/sauce-user.model';
import { expect, test } from '@ui/fixtures/pages.fixture';
import { storageStatePath } from '@ui/utils/auth';

// Tests that end a session: they log a user out or drop its session cookie. Every test shares the sessions the auth
// setup project saved, one per user, and there are no more users to create. Ending one of them mid-run could log out
// every other test using that user, so these run in the session-end project: after chromium, one test at a time.

test.describe('Logout', () => {
  // Every user who can log in, starting from the session the auth setup project saved for them
  for (const user of SESSION_USERS) {
    test.describe(`as ${user}`, () => {
      test.use({ storageState: storageStatePath(user) });

      test('returns to the login page', async ({ inventoryPage, loginPage, page }) => {
        await inventoryPage.goto();

        await inventoryPage.header.logout();

        await expect(page).toHaveURL(loginPage.path);
        await expect(loginPage.submit).toBeVisible();
      });
    });
  }

  test('blocks the inventory page afterwards', async ({ inventoryPage, loginPage, page }) => {
    await inventoryPage.goto();
    await inventoryPage.header.logout();
    await expect(page).toHaveURL(loginPage.path);
    // Logout changes the URL before the login page renders. Acting in between leaves the app on the product list.
    await expect(loginPage.submit).toBeVisible();

    await inventoryPage.goto();

    await expect(page).toHaveURL(loginPage.path);
    await expect(loginPage.error).toHaveText(LOGIN_ERRORS.loginRequired(inventoryPage.path));
  });

  test('does not restore the inventory page on Back', async ({ inventoryPage, loginPage, page }) => {
    await inventoryPage.goto();
    await inventoryPage.header.logout();
    await expect(page).toHaveURL(loginPage.path);
    // Logout changes the URL before the login page renders. Acting in between leaves the app on the product list.
    await expect(loginPage.submit).toBeVisible();

    await page.goBack();

    await expect(page).toHaveURL(loginPage.path);
    await expect(loginPage.error).toHaveText(LOGIN_ERRORS.loginRequired(inventoryPage.path));
  });
});

test.describe('Expired session', () => {
  test('sends the user to the login page on the next page load', async ({ inventoryPage, loginPage, page }) => {
    await inventoryPage.goto();
    // SauceDemo's session cookie expires after 10 minutes. Clearing cookies has the same effect right away.
    await page.context().clearCookies();

    await page.reload();

    await expect(page).toHaveURL(loginPage.path);
    await expect(loginPage.error).toHaveText(LOGIN_ERRORS.loginRequired(inventoryPage.path));
  });
});
