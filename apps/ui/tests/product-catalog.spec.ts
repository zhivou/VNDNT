// spec: specs/product-catalog.md
import {
  CATALOG,
  DEFAULT_SORT,
  PRODUCTS,
  SORT_OPTIONS,
  formatPrice,
  imageSrc,
} from '@ui/data-models/product-catalog.oracle';
import { expect, test } from '@ui/fixtures/pages.fixture';

// Runs as standard_user, the chromium project's session. Expected values come from the oracle, never from the page:
// when the site shows something else, the test fails and the difference is a finding.

test.describe('Product list', () => {
  test('shows every product with its intended details', async ({ inventoryPage }) => {
    await inventoryPage.goto();

    await expect(inventoryPage.title).toHaveText('Products');
    // productCards() reads the list once without waiting, so the count has to match first
    await expect(inventoryPage.items).toHaveCount(PRODUCTS.length);
    const cards = await inventoryPage.productCards();
    for (const [index, card] of cards.entries()) {
      // The list starts in the default order, the same order as PRODUCTS. The count above keeps the index in range.
      const product = PRODUCTS[index]!;

      await test.step(`${index + 1}. ${product.name}`, async () => {
        await expect.soft(card.name).toHaveText(product.name);
        await expect.soft(card.description).toHaveText(product.description);
        await expect.soft(card.price).toHaveText(formatPrice(product.price));
        await expect.soft(card.image).toHaveAttribute('alt', product.name);
        await expect.soft(card.image).toHaveAttribute('src', imageSrc(product));
        await expect.soft(card.addToCartButton).toBeVisible();
      });
    }
  });
});

test.describe('Sorting', () => {
  test('offers every sort option with name from A to Z selected', async ({ inventoryPage }) => {
    await inventoryPage.goto();

    await expect(inventoryPage.sortOptions).toHaveText(SORT_OPTIONS.map(({ label }) => label));
    await expect(inventoryPage.activeSort).toHaveText(DEFAULT_SORT);
  });

  for (const { description, label, names, prices } of SORT_OPTIONS) {
    test(`sorts products by ${description}`, async ({ inventoryPage }) => {
      await inventoryPage.goto();

      await inventoryPage.sortBy(label);

      await expect.soft(inventoryPage.activeSort).toHaveText(label);
      await expect.soft(inventoryPage.itemNames).toHaveText(names);
      await expect.soft(inventoryPage.itemPrices).toHaveText(prices);
    });
  }
});

test.describe('Product details', () => {
  for (const product of PRODUCTS) {
    test(`shows the details of ${product.name}`, async ({ inventoryPage, inventoryItemPage, page }) => {
      await inventoryPage.goto();

      await inventoryPage.product(product.name).nameLink.click();

      await expect(page).toHaveURL(inventoryItemPage.url(product.id));
      const details = inventoryItemPage.product;
      await expect.soft(details.name).toHaveText(product.name);
      await expect.soft(details.description).toHaveText(product.description);
      await expect.soft(details.price).toHaveText(formatPrice(product.price));
      await expect.soft(details.image).toHaveAttribute('alt', product.name);
      await expect.soft(details.image).toHaveAttribute('src', imageSrc(product));
      await expect.soft(details.addToCartButton).toBeVisible();
    });

    test(`opens ${product.name} from its image`, async ({ inventoryPage, inventoryItemPage, page }) => {
      await inventoryPage.goto();

      await inventoryPage.product(product.name).imageLink.click();

      await expect(page).toHaveURL(inventoryItemPage.url(product.id));
      await expect(inventoryItemPage.product.name).toHaveText(product.name);
    });
  }

  test('returns to the product list with Back to products', async ({ inventoryItemPage, inventoryPage, page }) => {
    await inventoryItemPage.goto(CATALOG.onesie.id);

    await inventoryItemPage.backButton.click();

    await expect(page).toHaveURL(inventoryPage.path);
    await expect(inventoryPage.items).toHaveCount(PRODUCTS.length);
  });
});

test.describe('Add to cart', () => {
  test('adds a product from the list', async ({ inventoryPage }) => {
    await inventoryPage.goto();
    const backpack = inventoryPage.product(CATALOG.backpack.name);

    await backpack.addToCartButton.click();

    await expect(backpack.removeButton).toBeVisible();
    await expect(inventoryPage.header.cartBadge).toHaveText('1');
  });

  test('removes a product from the list', async ({ inventoryPage }) => {
    await inventoryPage.goto();
    const bikeLight = inventoryPage.product(CATALOG.bikeLight.name);
    await bikeLight.addToCartButton.click();
    await expect(inventoryPage.header.cartBadge).toHaveText('1');

    await bikeLight.removeButton.click();

    await expect(bikeLight.addToCartButton).toBeVisible();
    await expect(inventoryPage.header.cartBadge).toBeHidden();
  });

  test('adds a product from its details page', async ({ inventoryItemPage }) => {
    await inventoryItemPage.goto(CATALOG.boltTShirt.id);

    await inventoryItemPage.product.addToCartButton.click();

    await expect(inventoryItemPage.product.removeButton).toBeVisible();
    await expect(inventoryItemPage.header.cartBadge).toHaveText('1');
  });

  test('removes a product on its details page', async ({ inventoryItemPage }) => {
    await inventoryItemPage.goto(CATALOG.boltTShirt.id);
    await inventoryItemPage.product.addToCartButton.click();
    await expect(inventoryItemPage.header.cartBadge).toHaveText('1');

    await inventoryItemPage.product.removeButton.click();

    await expect(inventoryItemPage.product.addToCartButton).toBeVisible();
    await expect(inventoryItemPage.header.cartBadge).toBeHidden();
  });

  test('shows a product added on the list as added on its details page', async ({
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

  test('shows a product removed on its details page as not added on the list', async ({
    inventoryPage,
    inventoryItemPage,
  }) => {
    await inventoryItemPage.goto(CATALOG.onesie.id);
    await inventoryItemPage.product.addToCartButton.click();
    await inventoryItemPage.product.removeButton.click();

    await inventoryItemPage.backButton.click();

    await expect(inventoryPage.product(CATALOG.onesie.name).addToCartButton).toBeVisible();
    await expect(inventoryPage.header.cartBadge).toBeHidden();
  });

  test('keeps the cart after a reload', async ({ inventoryPage, page }) => {
    await inventoryPage.goto();
    const fleeceJacket = inventoryPage.product(CATALOG.fleeceJacket.name);
    await fleeceJacket.addToCartButton.click();
    await expect(inventoryPage.header.cartBadge).toHaveText('1');

    await page.reload();

    await expect(fleeceJacket.removeButton).toBeVisible();
    await expect(inventoryPage.header.cartBadge).toHaveText('1');
  });

  test('counts every product added to the cart', async ({ inventoryPage }) => {
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
});
