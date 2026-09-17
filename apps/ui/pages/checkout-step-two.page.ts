import type { Locator, Page } from '@playwright/test';
import { CartItemComponent } from '@ui/components/cart-item.component';
import { HeaderComponent } from '@ui/components/header.component';

// The checkout overview: the order's products, payment and shipping, and its totals
export class CheckoutStepTwoPage {
  readonly path = '/checkout-step-two.html';
  readonly header: HeaderComponent;
  readonly title: Locator;
  readonly items: Locator;
  readonly paymentInformation: Locator;
  readonly shippingInformation: Locator;
  readonly itemTotal: Locator;
  readonly tax: Locator;
  readonly total: Locator;
  readonly cancelButton: Locator;
  readonly finishButton: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page.getByTestId('primary-header'));
    this.title = page.getByTestId('title');
    // Scoped to the overview: the cart page renders its rows with the same data-test names
    this.items = page.getByTestId('checkout-summary-container').getByTestId('inventory-item');
    this.paymentInformation = page.getByTestId('payment-info-value');
    this.shippingInformation = page.getByTestId('shipping-info-value');
    this.itemTotal = page.getByTestId('subtotal-label');
    this.tax = page.getByTestId('tax-label');
    this.total = page.getByTestId('total-label');
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.finishButton = page.getByRole('button', { name: 'Finish' });
  }

  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }

  // Every product row on the page right now, top to bottom. It doesn't wait: assert the item count first.
  async orderItems(): Promise<CartItemComponent[]> {
    const items = await this.items.all();
    return items.map((item) => new CartItemComponent(item));
  }
}
