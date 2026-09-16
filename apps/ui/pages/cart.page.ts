import type { Locator, Page } from '@playwright/test';
import { CartItemComponent } from '@ui/components/cart-item.component';
import { HeaderComponent } from '@ui/components/header.component';

export class CartPage {
  readonly path = '/cart.html';
  readonly header: HeaderComponent;
  readonly title: Locator;
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly continueShoppingButton: Locator;
  readonly checkoutButton: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page.getByTestId('primary-header'));
    this.title = page.getByTestId('title');
    // Scoped to the cart: the product list and the details page use the same data-test name for a product
    this.items = page.getByTestId('cart-list').getByTestId('inventory-item');
    this.itemNames = this.items.getByTestId('inventory-item-name');
    this.continueShoppingButton = page.getByRole('button', { name: 'Continue Shopping' });
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
  }

  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }

  // The row with exactly this product name
  item(name: string): CartItemComponent {
    const productName = this.page.getByTestId('inventory-item-name').and(this.page.getByText(name, { exact: true }));
    return new CartItemComponent(this.items.filter({ has: productName }));
  }

  // Every row on the page right now, top to bottom. It doesn't wait: assert the item count first.
  async cartItems(): Promise<CartItemComponent[]> {
    const items = await this.items.all();
    return items.map((item) => new CartItemComponent(item));
  }
}
