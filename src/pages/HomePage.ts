import { Page } from 'playwright';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  // Cuando el usuario está logueado, #top-links muestra "Logout"
  private readonly logoutLink = this.page.locator('#top-links').getByRole('link', { name: 'Logout' });
  // El heading de la página de cuenta es un h2 en OpenCart
  private readonly accountHeading = this.page.getByRole('heading', { name: 'My Account' });
  // El dropdown "My Account" en la barra superior
  private readonly myAccountDropdown = this.page.locator('#top-links .dropdown-toggle').first();

  constructor(page: Page) {
    super(page);
  }

  async isLoggedIn(): Promise<boolean> {
    return this.logoutLink.isVisible();
  }

  async getAccountName(): Promise<string> {
    await this.myAccountDropdown.waitFor({ state: 'visible' });
    return (await this.myAccountDropdown.textContent()) ?? '';
  }

  async getWelcomeText(): Promise<string> {
    await this.accountHeading.waitFor({ state: 'visible' });
    return (await this.accountHeading.textContent()) ?? '';
  }

  async navigateToCatalog(): Promise<void> {
    await this.navigate('/index.php?route=product/search&search=MacBook');
  }
}
