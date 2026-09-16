import type { Locator, Page } from '@playwright/test';
import type { SauceUser } from '@ui/data-models/sauce-user.model';

export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly submit: Locator;

  constructor(private readonly page: Page) {
    this.username = page.getByPlaceholder('Username');
    this.password = page.getByPlaceholder('Password');
    this.submit = page.getByRole('button', { name: 'Login' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async login(username: SauceUser, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submit.click();
  }
}
