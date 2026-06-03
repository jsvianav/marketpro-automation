import { Page } from 'playwright';
import { BasePage } from './BasePage';
import { CampaignDetailPage } from './CampaignDetailPage';

export class CatalogPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async searchCampaign(name: string): Promise<void> {
    await this.navigate(`/index.php?route=product/search&search=${encodeURIComponent(name)}`);
  }

  async openCampaign(name: string): Promise<CampaignDetailPage> {
    // Los links de productos están en .product-thumb h4 a
    const productLink = this.page.locator('.product-thumb h4 a', { hasText: name }).first();
    await productLink.waitFor({ state: 'visible', timeout: 15_000 });
    await productLink.click();
    await this.waitForPageLoad();
    return new CampaignDetailPage(this.page);
  }

  async campaignExists(name: string): Promise<boolean> {
    const productLink = this.page.locator('.product-thumb h4 a', { hasText: name }).first();
    return productLink.isVisible();
  }
}
