// spec: specs/checkout.md
import { BUYER } from '@ui/data-models/checkout.model';
import {
  BLANK_INFORMATION,
  CONFIRMATION,
  MISSING_INFORMATION,
  ORDER_DETAILS,
  RECEIPT_FILE_NAME,
} from '@ui/data-models/checkout.oracle';
import { CATALOG, PRODUCTS, formatPrice } from '@ui/data-models/product-catalog.oracle';
import { expect, test } from '@ui/fixtures/pages.fixture';

// Runs as standard_user, the chromium project's session. Expected values come from the oracles, never from the page:
// when the site shows something else, the test fails and the difference is a finding. A test that found a real bug is
// marked test.fixme() until the application is fixed. Opening a checkout page while logged out is covered in
// auth.spec.ts, and the totals for carts of every size in cart.spec.ts.

test.describe('Completing checkout', () => {
  test('places an order from the cart', async ({
    fillCart,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    page,
  }) => {
    await fillCart([CATALOG.backpack, CATALOG.bikeLight]);
    await cartPage.goto();

    await test.step('start checkout', async () => {
      await cartPage.checkoutButton.click();

      await expect(page).toHaveURL(checkoutStepOnePage.path);
      await expect(checkoutStepOnePage.title).toHaveText('Checkout: Your Information');
    });

    await test.step('submit the buyer information', async () => {
      await checkoutStepOnePage.submitInformation(BUYER);

      await expect(page).toHaveURL(checkoutStepTwoPage.path);
      await expect(checkoutStepTwoPage.title).toHaveText('Checkout: Overview');
    });

    await test.step('finish the order', async () => {
      await checkoutStepTwoPage.finishButton.click();

      await expect(page).toHaveURL(checkoutCompletePage.path);
      await expect(checkoutCompletePage.title).toHaveText('Checkout: Complete!');
    });
  });

  test('confirms the order once it is placed', async ({
    fillCart,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    await fillCart([CATALOG.backpack]);
    await checkoutStepOnePage.goto();
    await checkoutStepOnePage.submitInformation(BUYER);

    await checkoutStepTwoPage.finishButton.click();

    await expect(checkoutCompletePage.confirmationHeader).toHaveText(CONFIRMATION.header);
    await expect.soft(checkoutCompletePage.confirmationText).toHaveText(CONFIRMATION.text);
    await expect.soft(checkoutCompletePage.image).toHaveAttribute('alt', CONFIRMATION.imageAlt);
    await expect.soft(checkoutCompletePage.backHomeButton).toBeVisible();
  });

  test('empties the cart once the order is placed', async ({
    fillCart,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    cartPage,
  }) => {
    await fillCart([CATALOG.backpack, CATALOG.bikeLight]);
    await checkoutStepOnePage.goto();
    await checkoutStepOnePage.submitInformation(BUYER);
    await expect(checkoutStepTwoPage.header.cartBadge).toHaveText('2');

    await checkoutStepTwoPage.finishButton.click();

    await expect(checkoutCompletePage.confirmationHeader).toBeVisible();
    await expect(checkoutCompletePage.header.cartBadge).toBeHidden();
    await cartPage.goto();
    await expect(cartPage.title).toHaveText('Your Cart');
    await expect(cartPage.items).toHaveCount(0);
  });

  test('returns to the product list with Back Home', async ({
    fillCart,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    inventoryPage,
    page,
  }) => {
    await fillCart([CATALOG.backpack]);
    await checkoutStepOnePage.goto();
    await checkoutStepOnePage.submitInformation(BUYER);
    await checkoutStepTwoPage.finishButton.click();

    await checkoutCompletePage.backHomeButton.click();

    await expect(page).toHaveURL(inventoryPage.path);
    await expect(inventoryPage.items).toHaveCount(PRODUCTS.length);
    await expect(inventoryPage.removeButtons).toHaveCount(0);
  });

  test('downloads a PDF receipt of the order', async ({
    fillCart,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    await fillCart([CATALOG.backpack]);
    await checkoutStepOnePage.goto();
    await checkoutStepOnePage.submitInformation(BUYER);
    await checkoutStepTwoPage.finishButton.click();

    const receipt = await checkoutCompletePage.downloadReceipt();

    expect(receipt.suggestedFilename()).toMatch(RECEIPT_FILE_NAME);
  });
});

test.describe('Overview', () => {
  // Real bug: Sauce Labs Onesie's description reads "sleeved" instead of "sleeves". It needs a fix in the application,
  // not in this test. Remove test.fixme() once it's fixed.
  test.fixme('shows every product in the order with its intended details', async ({
    fillCart,
    checkoutStepOnePage,
    checkoutStepTwoPage,
  }) => {
    // The reverse of the catalog order, so rows that followed the catalog instead of the cart would fail
    const order = [...PRODUCTS].reverse();
    await fillCart(order);
    await checkoutStepOnePage.goto();

    await checkoutStepOnePage.submitInformation(BUYER);

    // orderItems() reads the rows once without waiting, so the count has to match first
    await expect(checkoutStepTwoPage.items).toHaveCount(order.length);
    const items = await checkoutStepTwoPage.orderItems();
    for (const [index, item] of items.entries()) {
      // Rows keep the order the products went into the cart. The count above keeps the index in range.
      const product = order[index]!;

      await test.step(`${index + 1}. ${product.name}`, async () => {
        await expect.soft(item.quantity).toHaveText('1');
        await expect.soft(item.name).toHaveText(product.name);
        await expect.soft(item.description).toHaveText(product.description);
        await expect.soft(item.price).toHaveText(formatPrice(product.price));
      });
    }
  });

  test('shows the payment and shipping information', async ({ fillCart, checkoutStepOnePage, checkoutStepTwoPage }) => {
    await fillCart([CATALOG.backpack]);
    await checkoutStepOnePage.goto();

    await checkoutStepOnePage.submitInformation(BUYER);

    await expect.soft(checkoutStepTwoPage.paymentInformation).toHaveText(ORDER_DETAILS.paymentInformation);
    await expect.soft(checkoutStepTwoPage.shippingInformation).toHaveText(ORDER_DETAILS.shippingInformation);
  });

  test('returns to the product list with Cancel and keeps the cart', async ({
    fillCart,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    inventoryPage,
    page,
  }) => {
    await fillCart([CATALOG.backpack, CATALOG.bikeLight]);
    await checkoutStepOnePage.goto();
    await checkoutStepOnePage.submitInformation(BUYER);

    await checkoutStepTwoPage.cancelButton.click();

    await expect(page).toHaveURL(inventoryPage.path);
    await expect(inventoryPage.removeButtons).toHaveCount(2);
    await expect(inventoryPage.header.cartBadge).toHaveText('2');
  });
});

test.describe('Your information', () => {
  for (const { description, buyer, error } of MISSING_INFORMATION) {
    test(`rejects ${description}`, async ({ fillCart, checkoutStepOnePage, page }) => {
      await fillCart([CATALOG.backpack]);
      await checkoutStepOnePage.goto();

      await checkoutStepOnePage.submitInformation(buyer);

      await expect(checkoutStepOnePage.error).toHaveText(error);
      await expect(page).toHaveURL(checkoutStepOnePage.path);
    });
  }

  // Real bug: a field of only spaces is accepted as filled in, and checkout continues to the overview. It needs a fix
  // in the application, not in these tests. Remove test.fixme() once it's fixed.
  for (const { description, buyer, error } of BLANK_INFORMATION) {
    test.fixme(`rejects ${description}`, async ({ fillCart, checkoutStepOnePage, page }) => {
      await fillCart([CATALOG.backpack]);
      await checkoutStepOnePage.goto();

      await checkoutStepOnePage.submitInformation(buyer);

      await expect(checkoutStepOnePage.error).toHaveText(error);
      await expect(page).toHaveURL(checkoutStepOnePage.path);
    });
  }

  test('hides the error when it is dismissed', async ({ fillCart, checkoutStepOnePage }) => {
    await fillCart([CATALOG.backpack]);
    await checkoutStepOnePage.goto();
    await checkoutStepOnePage.continueButton.click();
    await expect(checkoutStepOnePage.error).toBeVisible();

    await checkoutStepOnePage.dismissError.click();

    await expect(checkoutStepOnePage.error).toBeHidden();
  });

  test('continues once the missing information is filled in', async ({
    fillCart,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    page,
  }) => {
    await fillCart([CATALOG.backpack]);
    await checkoutStepOnePage.goto();
    await checkoutStepOnePage.submitInformation({ ...BUYER, postalCode: '' });
    await expect(checkoutStepOnePage.error).toBeVisible();

    await checkoutStepOnePage.postalCode.fill(BUYER.postalCode);
    await checkoutStepOnePage.continueButton.click();

    await expect(page).toHaveURL(checkoutStepTwoPage.path);
    await expect(checkoutStepTwoPage.title).toHaveText('Checkout: Overview');
  });

  test('returns to the cart with Cancel and keeps its products', async ({
    fillCart,
    checkoutStepOnePage,
    cartPage,
    page,
  }) => {
    const cart = [CATALOG.backpack, CATALOG.bikeLight];
    await fillCart(cart);
    await checkoutStepOnePage.goto();

    await checkoutStepOnePage.cancelButton.click();

    await expect(page).toHaveURL(cartPage.path);
    await expect(cartPage.itemNames).toHaveText(cart.map(({ name }) => name));
  });
});

// Typing a checkout page's URL must not skip a step. A page opens only once the steps before it are done. Otherwise the
// store sends the buyer to the first step that isn't: the cart while it's empty, then Your Information until it's
// submitted, then the overview until the order is finished.
// Real bug: every checkout page opens by its URL, whatever state the cart and checkout are in, so the confirmation can
// show "Thank you for your order!" for an order that was never placed. It needs a fix in the application, not in these
// tests. Remove test.describe.fixme() once it's fixed.
test.describe.fixme('Opening a checkout page by its URL', () => {
  test('sends an empty cart from Your Information back to the cart', async ({
    checkoutStepOnePage,
    cartPage,
    page,
  }) => {
    await checkoutStepOnePage.goto();

    await expect(page).toHaveURL(cartPage.path);
    await expect(cartPage.title).toHaveText('Your Cart');
  });

  test('sends an empty cart from the overview back to the cart', async ({ checkoutStepTwoPage, cartPage, page }) => {
    await checkoutStepTwoPage.goto();

    await expect(page).toHaveURL(cartPage.path);
    await expect(cartPage.title).toHaveText('Your Cart');
  });

  test('sends an empty cart from the confirmation back to the cart', async ({
    checkoutCompletePage,
    cartPage,
    page,
  }) => {
    await checkoutCompletePage.goto();

    await expect(page).toHaveURL(cartPage.path);
    await expect(cartPage.title).toHaveText('Your Cart');
  });

  test('opens the overview only after the information is submitted', async ({
    fillCart,
    checkoutStepTwoPage,
    checkoutStepOnePage,
    page,
  }) => {
    await fillCart([CATALOG.backpack]);

    await checkoutStepTwoPage.goto();

    await expect(page).toHaveURL(checkoutStepOnePage.path);
    await expect(checkoutStepOnePage.title).toHaveText('Checkout: Your Information');
  });

  test('opens the confirmation only after the information is submitted', async ({
    fillCart,
    checkoutCompletePage,
    checkoutStepOnePage,
    page,
  }) => {
    await fillCart([CATALOG.backpack]);

    await checkoutCompletePage.goto();

    await expect(page).toHaveURL(checkoutStepOnePage.path);
    await expect(checkoutStepOnePage.title).toHaveText('Checkout: Your Information');
  });

  test('opens the confirmation only after the order is finished', async ({
    fillCart,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    page,
  }) => {
    await fillCart([CATALOG.backpack]);
    await checkoutStepOnePage.goto();
    await checkoutStepOnePage.submitInformation(BUYER);
    await expect(checkoutStepTwoPage.title).toHaveText('Checkout: Overview');

    await checkoutCompletePage.goto();

    await expect(page).toHaveURL(checkoutStepTwoPage.path);
    await expect(checkoutStepTwoPage.header.cartBadge).toHaveText('1');
  });
});
