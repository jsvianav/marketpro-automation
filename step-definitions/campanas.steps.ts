import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../src/world/CustomWorld';
import { CatalogPage } from '../src/pages/CatalogPage';
import { CampaignDetailPage } from '../src/pages/CampaignDetailPage';
import { CheckoutPage } from '../src/pages/CheckoutPage';
import { ExcelHelper } from '../src/utils/ExcelHelper';

// Referencia de valor: evita que TypeScript elida el import de CustomWorld.
void CustomWorld;

// ─── E-P-05: Activación exitosa de campaña ───────────────────────────────

Given('el marketer ha iniciado sesión en MarketPro+', async function (this: CustomWorld) {
  // E-P-05 usa una cuenta dedicada (CAMPAIGN_EMAIL) para no verse afectado
  // cuando E-N-03 bloquea la cuenta principal en el mismo run.
  const email = process.env['CAMPAIGN_EMAIL'] ?? process.env['TEST_EMAIL'] ?? 'marketpro@test.com';
  const password = process.env['CAMPAIGN_PASSWORD'] ?? process.env['TEST_PASSWORD'] ?? 'Marketpro123!';
  await this.loginAs(email, password);
});

Given(
  'existe una campaña disponible {string} en el catálogo',
  async function (this: CustomWorld, campaignName: string) {
    this.testData['campaignName'] = campaignName;
    const catalogPage = new CatalogPage(this.page);
    await catalogPage.searchCampaign(campaignName);
    const exists = await catalogPage.campaignExists(campaignName);
    expect(exists).toBe(true);
  },
);

When('navega al detalle de la campaña', async function (this: CustomWorld) {
  const campaignName = this.testData['campaignName'] as string;
  const catalogPage = new CatalogPage(this.page);
  await catalogPage.openCampaign(campaignName);
});

When(
  'configura la campaña con cantidad {int}',
  async function (this: CustomWorld, quantity: number) {
    const detailPage = new CampaignDetailPage(this.page);
    await detailPage.setQuantity(quantity);
  },
);

When(
  'hace clic en {string} \\(Add to Cart)',
  async function (this: CustomWorld, _buttonLabel: string) {
    const detailPage = new CampaignDetailPage(this.page);
    await detailPage.addToCart();
  },
);

When(
  'procede a la confirmación de activación \\(checkout)',
  async function (this: CustomWorld) {
    const detailPage = new CampaignDetailPage(this.page);
    await detailPage.proceedToCheckout();
  },
);

When(
  'completa los datos de activación con los datos del archivo Excel',
  async function (this: CustomWorld) {
    const excel = new ExcelHelper();
    const data = await excel.readRow('Activacion', 1);
    this.testData['activationData'] = data;

    const checkoutPage = new CheckoutPage(this.page);
    await checkoutPage.completeCheckout();
  },
);

Then(
  'la campaña cambia su estado a {string} \\(Order Confirmed)',
  async function (this: CustomWorld, _status: string) {
    const checkoutPage = new CheckoutPage(this.page);
    const confirmed = await checkoutPage.isOrderConfirmed();
    expect(confirmed).toBe(true);
  },
);

Then(
  'el sistema muestra el número de confirmación de activación',
  async function (this: CustomWorld) {
    const checkoutPage = new CheckoutPage(this.page);
    const orderNumber = await checkoutPage.getOrderConfirmationNumber();
    this.testData['orderNumber'] = orderNumber;

    expect(orderNumber).not.toBe('N/A');
    expect(orderNumber.length).toBeGreaterThan(0);

    await this.attach(
      `✅ Número de activación confirmada: #${orderNumber}`,
      'text/plain',
    );
  },
);

Then(
  'se registra la activación en el historial del marketer',
  async function (this: CustomWorld) {
    const orderNumber = this.testData['orderNumber'] as string;

    // Guardar resultado en Excel — escritura de vuelta al archivo de datos
    const excel = new ExcelHelper();
    await excel.writeResult('Activacion', 1, 'numero_confirmacion', orderNumber);
    await excel.writeResult('Activacion', 1, 'fecha_activacion', new Date().toISOString());

    // Verificar que estamos en la página de historial de pedidos
    expect(this.page.url()).toContain('account/order');

    // Delegar al Page Object — CheckoutPage.isOrderInHistory() encapsula el selector
    const checkoutPage = new CheckoutPage(this.page);
    const inHistory = await checkoutPage.isOrderInHistory(orderNumber);
    expect(inHistory, `La orden #${orderNumber} no aparece en el historial`).toBe(true);
  },
);
