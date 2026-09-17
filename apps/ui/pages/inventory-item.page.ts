import type { Locator, Page } from '@playwright/test';
import { HeaderComponent } from '@ui/components/header.component';
import { ProductCardComponent } from '@ui/components/product-card.component';

// A product's details page
export class InventoryItemPage {
  readonly path = '/inventory-item.html';
  readonly header: HeaderComponent;
  readonly product: ProductCardComponent;
  readonly backButton: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page.getByTestId('primary-header'));
    // The list uses the same data-test names, and opening a product changes the URL before the page re-renders. This id
    // is the only thing unique to the details page, so it keeps a check from matching a list card mid-navigation.
    this.product = new ProductCardComponent(page.locator('#inventory_item_container').getByTestId('inventory-item'));
    this.backButton = page.getByRole('button', { name: 'Back to products' });
  }

  url(id: number): string {
    return `${this.path}?id=${id}`;
  }

  async goto(id: number): Promise<void> {
    await this.page.goto(this.url(id));
  }
}
