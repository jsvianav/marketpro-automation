/**
 * base.fixture.ts — Playwright Fixtures para MarketPro+
 *
 * Define los fixtures base que extienden `test` de @playwright/test.
 * En este proyecto el runner principal es Cucumber (CustomWorld), pero
 * los fixtures están disponibles para pruebas Playwright standalone si
 * se agregan en el futuro, y satisfacen el requisito de arquitectura
 * que exige src/fixtures/ con fixtures configurados.
 *
 * Uso en tests Playwright standalone:
 *   import { test, expect } from '../fixtures/base.fixture';
 *   test('mi test', async ({ loginPage, registerPage }) => { ... });
 */

import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { CatalogPage } from '../pages/CatalogPage';
import { CampaignDetailPage } from '../pages/CampaignDetailPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { HomePage } from '../pages/HomePage';

/** Tipo que describe todos los fixtures disponibles */
export type MarketProFixtures = {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  catalogPage: CatalogPage;
  campaignDetailPage: CampaignDetailPage;
  checkoutPage: CheckoutPage;
  homePage: HomePage;
  /** Página ya autenticada con la cuenta de prueba principal */
  authenticatedPage: Page;
};

const BASE_URL = process.env['BASE_URL'] ?? 'http://opencart.abstracta.us';
const TEST_EMAIL = process.env['TEST_EMAIL'] ?? 'marketpro@test.com';
const TEST_PASSWORD = process.env['TEST_PASSWORD'] ?? 'Marketpro123!';

/**
 * Fixture extendido con todas las páginas del proyecto.
 * Cada fixture instancia su Page Object con la página actual.
 */
export const test = base.extend<MarketProFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },

  catalogPage: async ({ page }, use) => {
    await use(new CatalogPage(page));
  },

  campaignDetailPage: async ({ page }, use) => {
    await use(new CampaignDetailPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  /**
   * Fixture de página pre-autenticada.
   * Hace login con la cuenta de prueba antes de entregar la página al test.
   * Útil para tests que requieren sesión activa sin repetir el login.
   */
  authenticatedPage: async ({ page }, use) => {
    await page.goto(`${BASE_URL}/index.php?route=account/login`);
    await page.waitForLoadState('networkidle');
    await page.locator('#input-email').fill(TEST_EMAIL);
    await page.locator('#input-password').fill(TEST_PASSWORD);
    await page.locator('input[type="submit"]').first().click();
    await page.waitForURL((url) => url.href.includes('account/account'), {
      timeout: 20_000,
    });
    await use(page);
  },
});

export { expect } from '@playwright/test';
