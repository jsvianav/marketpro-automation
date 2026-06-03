import { Page } from 'playwright';
import { BasePage } from './BasePage';

export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  password: string;
  confirmPassword: string;
}

export class RegisterPage extends BasePage {
  // Selectores por ID de OpenCart 3.x / 4.x
  private readonly firstNameInput = this.page.locator('#input-firstname');
  private readonly lastNameInput = this.page.locator('#input-lastname');
  private readonly emailInput = this.page.locator('#input-email');
  private readonly telephoneInput = this.page.locator('#input-telephone');
  private readonly passwordInput = this.page.locator('#input-password');
  private readonly confirmPasswordInput = this.page.locator('#input-confirm');
  private readonly privacyPolicyCheckbox = this.page.locator('input[name="agree"]');
  private readonly continueButton = this.page.locator('input[type="submit"], button[type="submit"]').first();
  // En opencart.abstracta.us, el éxito de registro se detecta por URL (account/success)
  // o por el texto "Congratulations" en el contenido. El h1 del sitio es solo "Account".
  private readonly successContent = this.page.locator('#content', { hasText: /congratulations/i });
  private readonly emailErrorAlert = this.page.locator('.alert-danger');

  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.navigate('/index.php?route=account/register');
    // Esperar a que el formulario esté disponible post-Cloudflare
    await this.firstNameInput.waitFor({ state: 'visible', timeout: 30_000 });
  }

  async fillRegistrationForm(data: RegistrationData): Promise<void> {
    await this.firstNameInput.waitFor({ state: 'visible', timeout: 30_000 });
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.emailInput.fill(data.email);
    await this.telephoneInput.fill(data.telephone);
    await this.passwordInput.fill(data.password);
    await this.confirmPasswordInput.fill(data.confirmPassword);
  }

  async acceptPrivacyPolicy(): Promise<void> {
    await this.privacyPolicyCheckbox.waitFor({ state: 'visible', timeout: 10_000 });
    await this.privacyPolicyCheckbox.check();
  }

  async submitForm(): Promise<void> {
    await this.continueButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getSuccessMessage(): Promise<string> {
    await this.successContent.waitFor({ state: 'visible', timeout: 15_000 });
    return (await this.successContent.textContent()) ?? '';
  }

  async isRegistrationSuccessful(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('account/success');
  }

  async getEmailErrorMessage(): Promise<string> {
    await this.emailErrorAlert.waitFor({ state: 'visible', timeout: 10_000 });
    return (await this.emailErrorAlert.textContent()) ?? '';
  }

  async isStillOnRegistrationPage(): Promise<boolean> {
    return this.page.url().includes('account/register');
  }
}
