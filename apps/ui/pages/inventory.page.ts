import type { Locator, Page } from '@playwright/test';
import { HeaderComponent } from '@ui/components/header.component';
import { ProductCardComponent } from '@ui/components/product-card.component';

export class InventoryPage {
  readonly path = '/inventory.html';
  readonly header: HeaderComponent;
  readonly title: Locator;
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  // Every card's Remove button: one per product in the cart
  readonly removeButtons: Locator;
  readonly sortSelect: Locator;
  readonly sortOptions: Locator;
  // The sort dropdown's visible label
  readonly activeSort: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page.getByTestId('primary-header'));
    this.title = page.getByTestId('title');
    // Scoped to the list: the details page renders its product with the same data-test name
    this.items = page.getByTestId('inventory-list').getByTestId('inventory-item');
    this.itemNames = this.items.getByTestId('inventory-item-name');
    this.itemPrices = this.items.getByTestId('inventory-item-price');
    this.removeButtons = this.items.getByRole('button', { name: 'Remove' });
    this.sortSelect = page.getByRole('combobox', { name: 'Sort products' });
    this.sortOptions = this.sortSelect.getByRole('option');
    this.activeSort = page.getByTestId('active-option');
  }

  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }

  // The card with exactly this product name
  product(name: string): ProductCardComponent {
    const productName = this.page.getByTestId('inventory-item-name').and(this.page.getByText(name, { exact: true }));
    return new ProductCardComponent(this.items.filter({ has: productName }));
  }

  // Every card on the page right now, top to bottom. It doesn't wait: assert the item count first.
  async productCards(): Promise<ProductCardComponent[]> {
    const items = await this.items.all();
    return items.map((item) => new ProductCardComponent(item));
  }

  async sortBy(label: string): Promise<void> {
    await this.sortSelect.selectOption({ label });
  }
}
