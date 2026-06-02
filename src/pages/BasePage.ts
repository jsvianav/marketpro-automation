import { Page } from 'playwright';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Navega a una ruta y espera a que la página esté completamente cargada.
   * Usa 'networkidle' para asegurar que el challenge de Cloudflare haya
   * terminado antes de interactuar con el DOM de OpenCart.
   */
  async navigate(path: string): Promise<void> {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    // networkidle garantiza que el JS challenge de CF haya terminado y la
    // página real de OpenCart esté completamente interactiva.
    await this.page.waitForLoadState('networkidle', { timeout: 45_000 });
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }
}
