import { Page } from 'playwright';
import { BasePage } from './BasePage';

/**
 * CheckoutPage — flujo de activación de campaña (checkout) en OpenCart.
 *
 * Maneja dos casos:
 *   A) Usuario con dirección guardada → selecciona "existing address" y continúa.
 *   B) Usuario sin dirección (cuenta nueva) → rellena el formulario de nueva dirección.
 *
 * Flujo verificado en opencart.abstracta.us:
 *   1. Panel #collapse-payment-address se abre por AJAX.
 *   2. Clic en #button-payment-address → abre #collapse-payment-method.
 *   3. Marcar checkbox agree + clic #button-payment-method → abre #collapse-checkout-confirm.
 *   4. Clic #button-confirm → navega a /checkout/success.
 *   5. El número de orden se lee desde /account/order.
 */
export class CheckoutPage extends BasePage {
  private readonly paymentAddressPanel = this.page.locator('#collapse-payment-address');
  private readonly existingAddressRadio = this.page.locator('input[name="payment_address"][value="existing"]');
  private readonly newAddressRadio = this.page.locator('input[name="payment_address"][value="new"]');

  // Campos del formulario de nueva dirección
  private readonly firstNameInput = this.page.locator('#input-payment-firstname');
  private readonly lastNameInput = this.page.locator('#input-payment-lastname');
  private readonly address1Input = this.page.locator('#input-payment-address-1');
  private readonly cityInput = this.page.locator('#input-payment-city');
  private readonly postCodeInput = this.page.locator('#input-payment-postcode');
  private readonly countrySelect = this.page.locator('#input-payment-country');
  private readonly zoneSelect = this.page.locator('#input-payment-zone');

  private readonly paymentAddressButton = this.page.locator('#button-payment-address');

  private readonly paymentMethodPanel = this.page.locator('#collapse-payment-method');
  private readonly agreeCheckbox = this.page.locator('#collapse-payment-method input[name="agree"]');
  private readonly paymentMethodButton = this.page.locator('#button-payment-method');

  private readonly confirmPanel = this.page.locator('#collapse-checkout-confirm');
  private readonly confirmButton = this.page.locator('#button-confirm');

  private readonly successHeading = this.page.locator('#content', { hasText: /order has been placed/i });
  private readonly firstOrderRow = this.page.locator('table tbody tr').first();

  constructor(page: Page) {
    super(page);
  }

  /** Espera a que el AJAX haya inyectado contenido real en el panel. */
  private async waitForPanelContent(panelId: string): Promise<void> {
    await this.page.waitForFunction(
      (id: string) => {
        const el = document.getElementById(id);
        return el !== null && el.innerHTML.trim().length > 50;
      },
      panelId,
      { timeout: 25_000 },
    );
  }

  async completeCheckout(): Promise<void> {
    // Esperar a que el panel de dirección de pago se pueble por AJAX
    await this.waitForPanelContent('collapse-payment-address');

    // Detectar si hay dirección guardada o si hay que rellenar una nueva
    const hasExisting = await this.existingAddressRadio.isVisible().catch(() => false);

    if (hasExisting) {
      // Cuenta con dirección guardada — ya viene seleccionada, solo continuar
      await this.paymentAddressButton.waitFor({ state: 'visible', timeout: 15_000 });
      await this.paymentAddressButton.click();
    } else {
      // Cuenta nueva sin dirección — rellenar formulario
      await this.firstNameInput.waitFor({ state: 'visible', timeout: 15_000 });
      await this.firstNameInput.fill('MarketPro');
      await this.lastNameInput.fill('User');
      await this.address1Input.fill('Calle 10 # 5-20');
      await this.cityInput.fill('Bogota');
      await this.postCodeInput.fill('110111');

      // Seleccionar Colombia y esperar que carguen las zonas
      await this.countrySelect.selectOption({ label: 'Colombia' });
      await this.page.waitForFunction(
        () => {
          const z = document.getElementById('input-payment-zone');
          return z !== null && (z as HTMLSelectElement).options.length > 1;
        },
        { timeout: 10_000 },
      );
      await this.zoneSelect.selectOption({ index: 1 });

      await this.paymentAddressButton.waitFor({ state: 'visible', timeout: 15_000 });
      await this.paymentAddressButton.click();
    }

    // Esperar panel de método de pago
    await this.waitForPanelContent('collapse-payment-method');

    // Marcar T&C si aparece y continuar
    const agreeVisible = await this.agreeCheckbox.isVisible().catch(() => false);
    if (agreeVisible) {
      await this.agreeCheckbox.check();
    }
    await this.paymentMethodButton.waitFor({ state: 'visible', timeout: 15_000 });
    await this.paymentMethodButton.click();

    // Esperar panel de confirmación
    await this.waitForPanelContent('collapse-checkout-confirm');
    await this.confirmButton.waitFor({ state: 'visible', timeout: 15_000 });
    await this.confirmButton.click();

    // Esperar navegación a la página de éxito
    await this.page.waitForURL((url) => url.href.includes('checkout/success'), { timeout: 30_000 });
  }

  async isOrderConfirmed(): Promise<boolean> {
    return this.successHeading.isVisible({ timeout: 10_000 });
  }

  /**
   * Lee el número de orden desde el historial de pedidos.
   * La página de éxito de OpenCart no muestra el ID directamente.
   */
  async getOrderConfirmationNumber(): Promise<string> {
    await this.successHeading.waitFor({ state: 'visible', timeout: 15_000 });
    await this.navigate('/index.php?route=account/order');

    await this.firstOrderRow.waitFor({ state: 'visible', timeout: 15_000 });
    const rowText = (await this.firstOrderRow.textContent()) ?? '';
    const match = rowText.match(/#(\d+)/);
    return match ? match[1] : 'N/A';
  }

  /** Verifica que el número de orden esté visible en la primera fila del historial */
  async isOrderInHistory(orderNumber: string): Promise<boolean> {
    await this.firstOrderRow.waitFor({ state: 'visible', timeout: 10_000 });
    const rowText = (await this.firstOrderRow.textContent()) ?? '';
    return rowText.includes(orderNumber);
  }
}
