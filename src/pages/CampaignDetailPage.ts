import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CampaignDetailPage extends BasePage {
  // Selectores verificados en opencart.abstracta.us
  private readonly quantityInput = this.page.locator('#input-quantity');
  private readonly addToCartButton = this.page.locator('#button-cart');
  private readonly cartSuccessAlert = this.page.locator('.alert-success');

  constructor(page: Page) {
    super(page);
  }

  async setQuantity(quantity: number): Promise<void> {
    await expect(this.quantityInput).toBeVisible({ timeout: 15_000 });
    await this.quantityInput.fill(String(quantity));
  }

  async addToCart(): Promise<void> {
    await expect(this.addToCartButton).toBeVisible({ timeout: 15_000 });
    await this.addToCartButton.click();
    await expect(this.cartSuccessAlert).toBeVisible({ timeout: 15_000 });
  }

  async getCartSuccessMessage(): Promise<string> {
    return (await this.cartSuccessAlert.textContent()) ?? '';
  }

  async proceedToCheckout(): Promise<void> {
    await this.navigate('/index.php?route=checkout/checkout');
  }
}
