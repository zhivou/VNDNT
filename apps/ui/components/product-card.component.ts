import type { Locator } from '@playwright/test';

// One product: a card in the inventory list, or the product on its details page. Both render the same pieces.
export class ProductCardComponent {
  readonly name: Locator;
  readonly description: Locator;
  readonly price: Locator;
  readonly image: Locator;
  // List cards only. Both links are named "View details for <name>", so only data-test tells them apart.
  readonly imageLink: Locator;
  readonly nameLink: Locator;
  readonly addToCartButton: Locator;
  readonly removeButton: Locator;

  constructor(root: Locator) {
    this.name = root.getByTestId('inventory-item-name');
    this.description = root.getByTestId('inventory-item-desc');
    this.price = root.getByTestId('inventory-item-price');
    this.image = root.getByRole('img');
    this.imageLink = root.getByTestId(/^item-\d+-img-link$/);
    this.nameLink = root.getByTestId(/^item-\d+-title-link$/);
    this.addToCartButton = root.getByRole('button', { name: 'Add to cart' });
    this.removeButton = root.getByRole('button', { name: 'Remove' });
  }
}
