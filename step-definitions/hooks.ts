import { Before, After, Status, setDefaultTimeout } from '@cucumber/cucumber';

// Aumentar el timeout de cada step a 60 s (el default de 5 s es insuficiente
// para operaciones de navegación real contra demo.opencart.com).
setDefaultTimeout(60_000);
import { CustomWorld } from '../src/world/CustomWorld';

// Referencia de VALOR: impide que TypeScript elida el import en la compilación.
// Sin esto, 'CustomWorld' solo aparece en posición de tipo (this: CustomWorld)
// y ts-node nunca ejecutaría el módulo, por lo que setWorldConstructor no se
// llamaría y Cucumber usaría su World base sin initBrowser/page/etc.
void CustomWorld;

Before(async function (this: CustomWorld) {
  await this.initBrowser();
  this.startTime = Date.now();
});

After(async function (this: CustomWorld, scenario) {
  // Guard: si initBrowser falló, page puede estar undefined
  if (scenario.result?.status === Status.FAILED && this.page) {
    try {
      const screenshot = await this.page.screenshot({ fullPage: true });
      await this.attach(screenshot, 'image/png');
    } catch {
      // No lanzar si la captura falla (p.ej. página ya cerrada)
    }
  }
  await this.closeBrowser();
});
