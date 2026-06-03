import { Page } from 'playwright';
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
    await this.emailInput.waitFor({ state: 'visible', timeout: 20_000 });
  }

  async login(email: string, password: string): Promise<HomePage> {
    await this.emailInput.waitFor({ state: 'visible', timeout: 20_000 });
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.page.waitForURL((url) => url.href.includes('account/account'), { timeout: 20_000 });
    return new HomePage(this.page);
  }

  /** Rellena los campos sin hacer clic — permite controlar el clic desde el step */
  async fillCredentials(email: string, password: string): Promise<void> {
    await this.emailInput.waitFor({ state: 'visible', timeout: 20_000 });
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  /** Hace clic en el botón de submit y devuelve el locator de error para Promise.race externo */
  get submitBtn() { return this.submitButton; }
  get errorAlertLocator() { return this.errorAlert; }

  /** Verifica que el heading de la cuenta sea visible */
  async isAccountPageVisible(): Promise<boolean> {
    return this.page.locator('#content').getByRole('heading', { name: 'My Account' }).isVisible();
  }

  /** Verifica que el toggle del menú de cuenta esté visible (usuario logueado) */
  async isAccountDropdownVisible(): Promise<boolean> {
    return this.page.locator('#top-links .dropdown-toggle').first().isVisible();
  }

  async loginWithInvalidCredentials(email: string, password: string): Promise<void> {
    await this.emailInput.waitFor({ state: 'visible', timeout: 20_000 });
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.page.waitForLoadState('load');
  }

  async getErrorMessage(): Promise<string> {
    await this.errorAlert.waitFor({ state: 'visible', timeout: 10_000 });
    return (await this.errorAlert.textContent()) ?? '';
  }

  async attemptMultipleFailedLogins(
    email: string,
    wrongPassword: string,
    attempts: number,
  ): Promise<void> {
    for (let i = 0; i < attempts; i++) {
      await this.emailInput.waitFor({ state: 'visible', timeout: 20_000 });
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
