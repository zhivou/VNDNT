import type { Locator, Page } from '@playwright/test';
import { HeaderComponent } from '@ui/components/header.component';

export class InventoryPage {
  readonly path = '/inventory.html';
  readonly header: HeaderComponent;
  readonly title: Locator;
  readonly items: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page.getByTestId('primary-header'));
    this.title = page.getByTestId('title');
    this.items = page.getByTestId('inventory-item');
  }

  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }
}
