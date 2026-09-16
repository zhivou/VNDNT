import type { Locator, Page } from '@playwright/test';
import type { Buyer } from '@ui/data-models/checkout.model';

// The first checkout step, where the buyer enters their name and postal code
export class CheckoutStepOnePage {
  readonly path = '/checkout-step-one.html';
  readonly title: Locator;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    this.title = page.getByTestId('title');
    this.firstName = page.getByPlaceholder('First Name');
    this.lastName = page.getByPlaceholder('Last Name');
    this.postalCode = page.getByPlaceholder('Zip/Postal Code');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
  }

  async submitInformation(buyer: Buyer): Promise<void> {
    await this.firstName.fill(buyer.firstName);
    await this.lastName.fill(buyer.lastName);
    await this.postalCode.fill(buyer.postalCode);
    await this.continueButton.click();
  }
}
