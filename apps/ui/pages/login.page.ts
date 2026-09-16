import type { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly path = '/';
  readonly username: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;
  readonly dismissError: Locator;

  constructor(private readonly page: Page) {
    this.username = page.getByPlaceholder('Username');
    this.password = page.getByPlaceholder('Password');
    this.submit = page.getByRole('button', { name: 'Login' });
    this.error = page.getByRole('alert');
    this.dismissError = page.getByRole('button', { name: 'Dismiss error' });
  }

  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }

  async fillCredentials(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
  }

  async login(username: string, password: string): Promise<void> {
    await this.fillCredentials(username, password);
    await this.submit.click();
  }
}
