import type { Locator } from '@playwright/test';

// One product row on the cart page or the checkout overview. The overview's rows have no Remove button.
export class CartItemComponent {
  readonly quantity: Locator;
  readonly name: Locator;
  readonly nameLink: Locator;
  readonly description: Locator;
  readonly price: Locator;
  readonly removeButton: Locator;

  constructor(root: Locator) {
    this.quantity = root.getByTestId('item-quantity');
    this.name = root.getByTestId('inventory-item-name');
    this.nameLink = root.getByTestId(/^item-\d+-title-link$/);
    this.description = root.getByTestId('inventory-item-desc');
    this.price = root.getByTestId('inventory-item-price');
    this.removeButton = root.getByRole('button', { name: 'Remove' });
  }
}
