import type { Locator, Page } from '@playwright/test';

// The checkout overview: the order's products and its totals
export class CheckoutStepTwoPage {
  readonly path = '/checkout-step-two.html';
  readonly title: Locator;
  readonly itemTotal: Locator;
  readonly tax: Locator;
  readonly total: Locator;

  constructor(page: Page) {
    this.title = page.getByTestId('title');
    this.itemTotal = page.getByTestId('subtotal-label');
    this.tax = page.getByTestId('tax-label');
    this.total = page.getByTestId('total-label');
  }
}
