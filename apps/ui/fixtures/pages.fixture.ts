import { test as base } from '@playwright/test';
import type { Product } from '@ui/data-models/product-catalog.oracle';
import { CartPage } from '@ui/pages/cart.page';
import { CheckoutCompletePage } from '@ui/pages/checkout-complete.page';
import { CheckoutStepOnePage } from '@ui/pages/checkout-step-one.page';
import { CheckoutStepTwoPage } from '@ui/pages/checkout-step-two.page';
import { InventoryItemPage } from '@ui/pages/inventory-item.page';
import { InventoryPage } from '@ui/pages/inventory.page';
import { LoginPage } from '@ui/pages/login.page';
import { env } from '@ui/utils/env';

type PageFixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  inventoryItemPage: InventoryItemPage;
  cartPage: CartPage;
  checkoutStepOnePage: CheckoutStepOnePage;
  checkoutStepTwoPage: CheckoutStepTwoPage;
  checkoutCompletePage: CheckoutCompletePage;
};

type StateFixtures = {
  // Puts these products in the cart, in this order, without the UI. Call it before the test opens a page.
  fillCart: (products: Product[]) => Promise<void>;
};

export const test = base.extend<PageFixtures & StateFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  inventoryItemPage: async ({ page }, use) => {
    await use(new InventoryItemPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutStepOnePage: async ({ page }, use) => {
    await use(new CheckoutStepOnePage(page));
  },
  checkoutStepTwoPage: async ({ page }, use) => {
    await use(new CheckoutStepTwoPage(page));
  },
  checkoutCompletePage: async ({ page }, use) => {
    await use(new CheckoutCompletePage(page));
  },
  fillCart: async ({ context }, use) => {
    await use(async (products) => {
      // SauceDemo keeps the cart only in localStorage: cart-contents is a JSON array of product ids, in the order they
      // were added. setStorageState replaces the whole state, so pass the session cookie back in with it.
      const origin = new URL(env.UI_BASE_URL).origin;
      const cart = { name: 'cart-contents', value: JSON.stringify(products.map(({ id }) => id)) };
      const state = await context.storageState();
      await context.setStorageState({
        ...state,
        origins: [...state.origins.filter((entry) => entry.origin !== origin), { origin, localStorage: [cart] }],
      });
    });
  },
});

export { expect } from '@playwright/test';
