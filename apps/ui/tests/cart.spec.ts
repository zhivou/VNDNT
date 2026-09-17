// spec: specs/cart.md
import { CARTS, cartTotals } from '@ui/data-models/cart.oracle';
import { BUYER } from '@ui/data-models/checkout.model';
import { CATALOG, PRODUCTS, formatPrice } from '@ui/data-models/product-catalog.oracle';
import { expect, test } from '@ui/fixtures/pages.fixture';

// Runs as standard_user, the chromium project's session. Expected values come from the oracle, never from the page:
// when the site shows something else, the test fails and the difference is a finding. A test that found a real bug is
// marked test.fixme() until the application is fixed.

test.describe('Adding and removing', () => {
  test('adds a product from the list', { tag: '@p1' }, async ({ inventoryPage }) => {
    await inventoryPage.goto();
    const backpack = inventoryPage.product(CATALOG.backpack.name);

    await backpack.addToCartButton.click();

    await expect(backpack.removeButton).toBeVisible();
    await expect(inventoryPage.header.cartBadge).toHaveText('1');
  });

  test('removes a product from the list', { tag: '@p2' }, async ({ fillCart, inventoryPage }) => {
    await fillCart([CATALOG.bikeLight]);
    await inventoryPage.goto();
    const bikeLight = inventoryPage.product(CATALOG.bikeLight.name);

    await bikeLight.removeButton.click();

    await expect(bikeLight.addToCartButton).toBeVisible();
    await expect(inventoryPage.header.cartBadge).toBeHidden();
  });

  test('adds a product from its details page', { tag: '@p2' }, async ({ inventoryItemPage }) => {
    await inventoryItemPage.goto(CATALOG.boltTShirt.id);

    await inventoryItemPage.product.addToCartButton.click();

    await expect(inventoryItemPage.product.removeButton).toBeVisible();
    await expect(inventoryItemPage.header.cartBadge).toHaveText('1');
  });

  test('removes a product on its details page', { tag: '@p2' }, async ({ fillCart, inventoryItemPage }) => {
    await fillCart([CATALOG.boltTShirt]);
    await inventoryItemPage.goto(CATALOG.boltTShirt.id);

    await inventoryItemPage.product.removeButton.click();

    await expect(inventoryItemPage.product.addToCartButton).toBeVisible();
    await expect(inventoryItemPage.header.cartBadge).toBeHidden();
  });

  test('shows a product added on the list as added on its details page', { tag: '@p2' }, async ({
    inventoryPage,
    inventoryItemPage,
  }) => {
    await inventoryPage.goto();
    const onesie = inventoryPage.product(CATALOG.onesie.name);
    await onesie.addToCartButton.click();

    await onesie.nameLink.click();

    await expect(inventoryItemPage.product.removeButton).toBeVisible();
    await expect(inventoryItemPage.header.cartBadge).toHaveText('1');
  });

  test('shows a product removed on its details page as not added on the list', { tag: '@p2' }, async ({
    fillCart,
    inventoryPage,
    inventoryItemPage,
  }) => {
    await fillCart([CATALOG.onesie]);
    await inventoryItemPage.goto(CATALOG.onesie.id);
    await inventoryItemPage.product.removeButton.click();

    await inventoryItemPage.backButton.click();

    await expect(inventoryPage.product(CATALOG.onesie.name).addToCartButton).toBeVisible();
    await expect(inventoryPage.header.cartBadge).toBeHidden();
  });

  test('counts every product added to the cart', { tag: '@p2' }, async ({ inventoryPage }) => {
    await inventoryPage.goto();

    for (const [index, product] of PRODUCTS.entries()) {
      await test.step(`add ${product.name}`, async () => {
        const card = inventoryPage.product(product.name);

        await card.addToCartButton.click();

        await expect(card.removeButton).toBeVisible();
        // Only the products added so far show Remove
        await expect(inventoryPage.removeButtons).toHaveCount(index + 1);
        await expect(inventoryPage.header.cartBadge).toHaveText(String(index + 1));
      });
    }
  });

  test('hides the badge only once the last product is removed', { tag: '@p2' }, async ({ fillCart, inventoryPage }) => {
    await fillCart([CATALOG.bikeLight, CATALOG.onesie]);
    await inventoryPage.goto();
    await expect(inventoryPage.header.cartBadge).toHaveText('2');

    await inventoryPage.product(CATALOG.bikeLight.name).removeButton.click();
    await expect(inventoryPage.header.cartBadge).toHaveText('1');

    await inventoryPage.product(CATALOG.onesie.name).removeButton.click();
    await expect(inventoryPage.header.cartBadge).toBeHidden();
  });

  test('keeps the cart after a reload', { tag: '@p2' }, async ({ inventoryPage, page }) => {
    await inventoryPage.goto();
    const fleeceJacket = inventoryPage.product(CATALOG.fleeceJacket.name);
    await fleeceJacket.addToCartButton.click();
    await expect(inventoryPage.header.cartBadge).toHaveText('1');

    await page.reload();

    await expect(fleeceJacket.removeButton).toBeVisible();
    await expect(inventoryPage.header.cartBadge).toHaveText('1');
  });
});

test.describe('Cart page', () => {
  test('opens from the cart link in the header', { tag: '@p1' }, async ({ inventoryPage, cartPage, page }) => {
    await inventoryPage.goto();

    await inventoryPage.header.cartLink.click();

    await expect(page).toHaveURL(cartPage.path);
    await expect(cartPage.title).toHaveText('Your Cart');
  });

  // Real bug: Sauce Labs Onesie's description reads "sleeved" instead of "sleeves". It needs a fix in the application,
  // not in this test. Remove test.fixme() once it's fixed.
  test.fixme('shows every product in the cart with its intended details', { tag: '@p2' }, async ({
    fillCart,
    cartPage,
  }) => {
    await fillCart(PRODUCTS);
    await cartPage.goto();

    // cartItems() reads the rows once without waiting, so the count has to match first
    await expect(cartPage.items).toHaveCount(PRODUCTS.length);
    const items = await cartPage.cartItems();
    for (const [index, item] of items.entries()) {
      // Rows keep the order the products went into the cart, the same order as PRODUCTS. The count above keeps the
      // index in range.
      const product = PRODUCTS[index]!;

      await test.step(`${index + 1}. ${product.name}`, async () => {
        await expect.soft(item.quantity).toHaveText('1');
        await expect.soft(item.name).toHaveText(product.name);
        await expect.soft(item.description).toHaveText(product.description);
        await expect.soft(item.price).toHaveText(formatPrice(product.price));
        await expect.soft(item.removeButton).toBeVisible();
      });
    }
  });

  test('lists only the products added, in the order they were added', { tag: '@p2' }, async ({
    inventoryPage,
    cartPage,
  }) => {
    const added = [CATALOG.onesie, CATALOG.backpack, CATALOG.fleeceJacket];
    await inventoryPage.goto();
    for (const product of added) {
      await inventoryPage.product(product.name).addToCartButton.click();
    }

    await inventoryPage.header.cartLink.click();

    await expect(cartPage.itemNames).toHaveText(added.map(({ name }) => name));
  });

  test('shows no products while the cart is empty', { tag: '@p2' }, async ({ cartPage }) => {
    await cartPage.goto();

    await expect(cartPage.title).toHaveText('Your Cart');
    await expect(cartPage.items).toHaveCount(0);
    await expect(cartPage.header.cartBadge).toBeHidden();
  });
});

test.describe('Removing from the cart page', { tag: '@p2' }, () => {
  test('removes a product and keeps the rest in order', async ({ fillCart, cartPage }) => {
    await fillCart([CATALOG.backpack, CATALOG.bikeLight, CATALOG.onesie]);
    await cartPage.goto();
    await expect(cartPage.items).toHaveCount(3);

    await cartPage.item(CATALOG.bikeLight.name).removeButton.click();

    await expect(cartPage.itemNames).toHaveText([CATALOG.backpack.name, CATALOG.onesie.name]);
    await expect(cartPage.header.cartBadge).toHaveText('2');
  });

  test('shows a product removed on the cart page as not added on the list', async ({
    fillCart,
    cartPage,
    inventoryPage,
  }) => {
    await fillCart([CATALOG.backpack]);
    await cartPage.goto();
    await cartPage.item(CATALOG.backpack.name).removeButton.click();

    await cartPage.continueShoppingButton.click();

    await expect(inventoryPage.product(CATALOG.backpack.name).addToCartButton).toBeVisible();
    await expect(inventoryPage.header.cartBadge).toBeHidden();
  });
});

test.describe('Navigation', () => {
  test("opens a product's details from its name", { tag: '@p3' }, async ({
    fillCart,
    cartPage,
    inventoryItemPage,
    page,
  }) => {
    await fillCart([CATALOG.backpack]);
    await cartPage.goto();

    await cartPage.item(CATALOG.backpack.name).nameLink.click();

    await expect(page).toHaveURL(inventoryItemPage.url(CATALOG.backpack.id));
    await expect(inventoryItemPage.product.name).toHaveText(CATALOG.backpack.name);
  });

  test('returns to the product list with Continue Shopping', { tag: '@p3' }, async ({
    cartPage,
    inventoryPage,
    page,
  }) => {
    await cartPage.goto();

    await cartPage.continueShoppingButton.click();

    await expect(page).toHaveURL(inventoryPage.path);
    await expect(inventoryPage.items).toHaveCount(PRODUCTS.length);
  });

  test('goes to checkout with Checkout', { tag: '@p1' }, async ({ fillCart, cartPage, checkoutStepOnePage, page }) => {
    await fillCart([CATALOG.backpack]);
    await cartPage.goto();

    await cartPage.checkoutButton.click();

    await expect(page).toHaveURL(checkoutStepOnePage.path);
    await expect(checkoutStepOnePage.title).toHaveText('Checkout: Your Information');
  });

  // Real bug: Checkout is enabled with an empty cart. It needs a fix in the application, not in this test. Remove
  // test.fixme() once it's fixed.
  test.fixme('disables Checkout while the cart is empty', { tag: '@p2' }, async ({ cartPage }) => {
    await cartPage.goto();

    await expect(cartPage.title).toHaveText('Your Cart');
    await expect(cartPage.checkoutButton).toBeDisabled();
  });
});

// Real bug: Reset App State empties the cart, but the Remove buttons and cart rows stay until the page reloads. It
// needs a fix in the application, not in these tests. Remove test.describe.fixme() once it's fixed.
test.describe.fixme('Reset App State', { tag: '@p3' }, () => {
  test('empties the cart on the product list', async ({ fillCart, inventoryPage }) => {
    await fillCart([CATALOG.backpack, CATALOG.bikeLight]);
    await inventoryPage.goto();
    await expect(inventoryPage.removeButtons).toHaveCount(2);

    await inventoryPage.header.resetAppState();

    await expect(inventoryPage.header.cartBadge).toBeHidden();
    await expect(inventoryPage.removeButtons).toHaveCount(0);
  });

  test('empties the cart page', async ({ fillCart, cartPage }) => {
    await fillCart([CATALOG.backpack, CATALOG.bikeLight]);
    await cartPage.goto();
    await expect(cartPage.items).toHaveCount(2);

    await cartPage.header.resetAppState();

    await expect(cartPage.header.cartBadge).toBeHidden();
    await expect(cartPage.items).toHaveCount(0);
  });
});

test.describe('Totals', { tag: '@p1' }, () => {
  // The cart page shows no totals. The checkout overview is the first page that adds the cart up.
  for (const { description, products } of CARTS) {
    test(`totals ${description} at checkout`, async ({
      fillCart,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
    }) => {
      // Real bug: the 4-product cart shows "Item total: $105.96000000000001", not rounded to cents. It needs a fix in
      // the application, not in this test. Remove test.fixme() once it's fixed.
      test.fixme(products.length === 4, 'Real bug: the item total is not rounded to cents');
      await fillCart(products);
      await cartPage.goto();
      await cartPage.checkoutButton.click();

      await checkoutStepOnePage.submitInformation(BUYER);

      const totals = cartTotals(products);
      await expect.soft(checkoutStepTwoPage.itemTotal).toHaveText(totals.itemTotal);
      await expect.soft(checkoutStepTwoPage.tax).toHaveText(totals.tax);
      await expect.soft(checkoutStepTwoPage.total).toHaveText(totals.total);
    });
  }
});
