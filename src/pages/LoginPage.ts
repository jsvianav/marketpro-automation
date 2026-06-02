import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { HomePage } from './HomePage';

export class LoginPage extends BasePage {
  // Selectores verificados en opencart.abstracta.us
  private readonly emailInput = this.page.locator('#input-email');
  private readonly passwordInput = this.page.locator('#input-password');
  // El botón de login es input[type="submit"] (no un <button>)
  private readonly submitButton = this.page.locator('input[type="submit"]').first();
  private readonly errorAlert = this.page.locator('.alert-danger');

  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.navigate('/index.php?route=account/login');
    await expect(this.emailInput).toBeVisible({ timeout: 20_000 });
  }

  async login(email: string, password: string): Promise<HomePage> {
    await expect(this.emailInput).toBeVisible({ timeout: 20_000 });
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.page.waitForURL((url) => url.href.includes('account/account'), { timeout: 20_000 });
    return new HomePage(this.page);
  }

  async loginWithInvalidCredentials(email: string, password: string): Promise<void> {
    await expect(this.emailInput).toBeVisible({ timeout: 20_000 });
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.page.waitForLoadState('load');
  }

  async getErrorMessage(): Promise<string> {
    await expect(this.errorAlert).toBeVisible({ timeout: 10_000 });
    return (await this.errorAlert.textContent()) ?? '';
  }

  async attemptMultipleFailedLogins(
    email: string,
    wrongPassword: string,
    attempts: number,
  ): Promise<void> {
    for (let i = 0; i < attempts; i++) {
      await expect(this.emailInput).toBeVisible({ timeout: 20_000 });
      await this.emailInput.fill(email);
      await this.passwordInput.fill(wrongPassword);
      await this.submitButton.click();
      await this.page.waitForLoadState('load');

      const alertVisible = await this.errorAlert.isVisible();
      if (alertVisible) {
        const msg = (await this.errorAlert.textContent()) ?? '';
        if (msg.toLowerCase().includes('lock') || msg.toLowerCase().includes('exceed')) {
          return; // ya está bloqueado antes del intento N
        }
      }
    }
  }

  async isLockedOut(): Promise<boolean> {
    const visible = await this.errorAlert.isVisible();
    if (!visible) return false;
    const msg = (await this.errorAlert.textContent()) ?? '';
    return msg.toLowerCase().includes('lock') || msg.toLowerCase().includes('exceed');
  }
}
