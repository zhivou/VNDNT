import { test as base } from '@playwright/test';
import { InventoryItemPage } from '@ui/pages/inventory-item.page';
import { InventoryPage } from '@ui/pages/inventory.page';
import { LoginPage } from '@ui/pages/login.page';

type PageFixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  inventoryItemPage: InventoryItemPage;
};

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  inventoryItemPage: async ({ page }, use) => {
    await use(new InventoryItemPage(page));
  },
});

export { expect } from '@playwright/test';
