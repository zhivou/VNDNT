import { expect, test } from '@ui/fixtures/pages.fixture';

test('shows the product list to a logged-in user', { tag: '@smoke' }, async ({ inventoryPage }) => {
  await inventoryPage.goto();

  await expect(inventoryPage.title).toHaveText('Products');
  // SauceDemo's catalogue is fixed at six products
  await expect(inventoryPage.items).toHaveCount(6);
});
