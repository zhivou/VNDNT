import type { Locator } from '@playwright/test';

// The bar at the top of every logged-in page. The side menu opens from it.
export class HeaderComponent {
  readonly menuButton: Locator;
  readonly logoutButton: Locator;
  readonly resetAppStateButton: Locator;
  readonly cartLink: Locator;
  // The item count on the cart icon. It's gone while the cart is empty.
  readonly cartBadge: Locator;

  constructor(root: Locator) {
    this.menuButton = root.getByRole('button', { name: 'Open Menu' });
    // Menu items are links with role="button". The closed menu is aria-hidden, so they only match once it's open.
    this.logoutButton = root.getByRole('button', { name: 'Logout' });
    this.resetAppStateButton = root.getByRole('button', { name: 'Reset App State' });
    // Its accessible name changes with the count ("Cart, empty", "Cart, 2 items"), so match it by data-test
    this.cartLink = root.getByTestId('shopping-cart-link');
    this.cartBadge = root.getByTestId('shopping-cart-badge');
  }

  async logout(): Promise<void> {
    await this.menuButton.click();
    await this.logoutButton.click();
  }

  async resetAppState(): Promise<void> {
    await this.menuButton.click();
    await this.resetAppStateButton.click();
  }
}
