import type { Download, Locator, Page } from '@playwright/test';
import { HeaderComponent } from '@ui/components/header.component';

// The confirmation shown once the order is placed
export class CheckoutCompletePage {
  readonly path = '/checkout-complete.html';
  readonly header: HeaderComponent;
  readonly title: Locator;
  readonly image: Locator;
  readonly confirmationHeader: Locator;
  readonly confirmationText: Locator;
  readonly backHomeButton: Locator;
  readonly receiptButton: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page.getByTestId('primary-header'));
    this.title = page.getByTestId('title');
    this.image = page.getByTestId('checkout-complete-container').getByRole('img');
    this.confirmationHeader = page.getByTestId('complete-header');
    this.confirmationText = page.getByTestId('complete-text');
    this.backHomeButton = page.getByRole('button', { name: 'Back Home' });
    this.receiptButton = page.getByRole('button', { name: 'Generate PDF order' });
  }

  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }

  // The receipt comes as a file download, so listen for it before clicking
  async downloadReceipt(): Promise<Download> {
    const download = this.page.waitForEvent('download');
    await this.receiptButton.click();
    return download;
  }
}
