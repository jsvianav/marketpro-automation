import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium } from 'playwright';

export class CustomWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  startTime: number = 0;
  testData: Record<string, unknown> = {};

  readonly baseUrl: string;
  readonly headless: boolean;

  constructor(options: IWorldOptions) {
    super(options);
    const params = options.parameters as Record<string, unknown>;
    this.baseUrl = (params['baseUrl'] as string | undefined) ?? 'http://opencart.abstracta.us';
    this.headless = (params['headless'] as boolean | undefined) ?? true;
  }

  async initBrowser(): Promise<void> {
    this.browser = await chromium.launch({ headless: this.headless });
    this.context = await this.browser.newContext({
      baseURL: this.baseUrl,
      viewport: { width: 1280, height: 720 },
    });
    this.page = await this.context.newPage();
  }

  async closeBrowser(): Promise<void> {
    await this.page?.close().catch(() => undefined);
    await this.context?.close().catch(() => undefined);
    await this.browser?.close().catch(() => undefined);
  }

  /**
   * Hace login y espera a que la URL de cuenta aparezca.
   * El botón de login en OpenCart es input[type="submit"] (no un <button>).
   */
  async loginAs(email: string, password: string): Promise<void> {
    await this.page.goto(`${this.baseUrl}/index.php?route=account/login`);
    await this.page.waitForLoadState('networkidle');
    await this.page.locator('#input-email').waitFor({ state: 'visible', timeout: 20_000 });
    await this.page.locator('#input-email').fill(email);
    await this.page.locator('#input-password').fill(password);
    await this.page.locator('input[type="submit"]').first().click();
    await this.page.waitForURL((url) => url.href.includes('account/account'), { timeout: 20_000 });
  }

  elapsedMs(): number {
    return Date.now() - this.startTime;
  }
}

setWorldConstructor(CustomWorld);
