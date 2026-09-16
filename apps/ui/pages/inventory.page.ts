import type { Locator, Page } from '@playwright/test';

export class InventoryPage {
  readonly title: Locator;
  readonly items: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title');
    this.items = page.getByTestId('inventory-item');
  }

  async goto(): Promise<void> {
    await this.page.goto('/inventory.html');
  }
}
