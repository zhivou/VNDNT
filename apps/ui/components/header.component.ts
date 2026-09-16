import type { Locator } from '@playwright/test';

// The bar at the top of every logged-in page. The side menu opens from it.
export class HeaderComponent {
  readonly menuButton: Locator;
  readonly logoutButton: Locator;
  // The item count on the cart icon. It's gone while the cart is empty.
  readonly cartBadge: Locator;

  constructor(root: Locator) {
    this.menuButton = root.getByRole('button', { name: 'Open Menu' });
    // A link with role="button". The closed menu is aria-hidden, so it only matches once the menu is open.
    this.logoutButton = root.getByRole('button', { name: 'Logout' });
    this.cartBadge = root.getByTestId('shopping-cart-badge');
  }

  async logout(): Promise<void> {
    await this.menuButton.click();
    await this.logoutButton.click();
  }
}
