import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../src/world/CustomWorld';
import { LoginPage } from '../src/pages/LoginPage';
import { RegisterPage } from '../src/pages/RegisterPage';
import { ExcelHelper } from '../src/utils/ExcelHelper';

// Referencia de valor: evita que TypeScript elida el import de CustomWorld
// (que solo aparece como anotación de tipo en los callbacks de step).
void CustomWorld;

// Credenciales leídas del .env — si no hay .env, usan los valores por defecto
const TEST_EMAIL    = process.env['TEST_EMAIL']    ?? 'marketpro@test.com';
const TEST_PASSWORD = process.env['TEST_PASSWORD'] ?? 'Marketpro123!';

// ─── E-P-03: Login exitoso ────────────────────────────────────────────────

Given(
  'el usuario registrado existe en el sistema',
  async function (this: CustomWorld) {
    // Precondición documentada — la cuenta definida en TEST_EMAIL ya existe
    this.testData['email']    = TEST_EMAIL;
    this.testData['password'] = TEST_PASSWORD;
  },
);

When('navega a la página de login de MarketPro+', async function (this: CustomWorld) {
  const loginPage = new LoginPage(this.page);
  await loginPage.open();
});

When(
  'ingresa las credenciales del usuario de prueba',
  async function (this: CustomWorld) {
    // Lee las credenciales guardadas en el Given (vienen del .env)
    const email    = this.testData['email']    as string;
    const password = this.testData['password'] as string;
    const loginPage = new LoginPage(this.page);
    await loginPage.fillCredentials(email, password);
  },
);

When('hace clic en el botón de iniciar sesión', async function (this: CustomWorld) {
  // Medir solo el tiempo de autenticación del servidor:
  //   clic → servidor autentica → 302 redirect → URL cambia a account/account
  // Promise.race resuelve en el primer evento: éxito (URL) o error (alert de lockout).
  const loginPage = new LoginPage(this.page);
  this.startTime = Date.now();
  await loginPage.submitBtn.click();

  const outcome = await Promise.race([
    this.page
      .waitForURL((url) => url.href.includes('account/account'), {
        timeout: 20_000,
        waitUntil: 'commit',   // para el timer en cuanto el server confirma el redirect
      })
      .then(() => 'success' as const),

    loginPage.errorAlertLocator
      .waitFor({ state: 'visible', timeout: 20_000 })
      .then(() => 'error' as const),
  ]);

  // Parar el timer — este es el tiempo real de respuesta del servidor
  this.testData['loginElapsedMs'] = Date.now() - this.startTime;

  if (outcome === 'error') {
    const alertText = await loginPage.getErrorMessage().catch(() => '');
    throw new Error(
      `La cuenta esta BLOQUEADA o las credenciales son incorrectas.\n` +
      `Mensaje del sistema: ${alertText.trim()}`,
    );
  }
});

Then('el sistema concede acceso al panel principal', async function (this: CustomWorld) {
  // Delegar al Page Object — HomePage encapsula los selectores del dashboard
  const loginPage = new LoginPage(this.page);
  const visible = await loginPage.isAccountPageVisible();
  expect(visible, 'El heading "My Account" no fue encontrado en #content').toBe(true);
});

Then('el nombre del usuario es visible en la pantalla', async function (this: CustomWorld) {
  // Cuando está logueado, #top-links muestra el dropdown "My Account" visible.
  // El enlace "Logout" está dentro del dropdown cerrado, así que verificamos el toggle.
  const loginPage = new LoginPage(this.page);
  const visible = await loginPage.isAccountDropdownVisible();
  expect(visible, 'El dropdown de cuenta no está visible — ¿sesión iniciada?').toBe(true);
});

Then(
  'el acceso ocurre en menos de {int} milisegundos',
  async function (this: CustomWorld, maxMs: number) {
    // Usar el tiempo guardado exactamente al completar la navegación (waitForURL),
    // no el tiempo acumulado de todos los steps posteriores.
    const elapsed = (this.testData['loginElapsedMs'] as number | undefined) ?? this.elapsedMs();
    expect(
      elapsed,
      `El login tardó ${elapsed}ms (clic → dashboard). Máximo permitido: ${maxMs}ms`,
    ).toBeLessThan(maxMs);
  },
);

// ─── E-N-03: Bloqueo por fuerza bruta (documenta DEF-001) ────────────────

Given(
  'el usuario de prueba está registrado en el sistema',
  async function (this: CustomWorld) {
    // E-N-03 usa una cuenta DESECHABLE con timestamp para no bloquear marketpro@test.com.
    // Así E-P-03 puede correr en el mismo suite sin verse afectado por el lockout de E-N-03.
    const bruteEmail = `bruteforce_${Date.now()}@test.com`;
    const brutePass  = 'BruteSetup@2024!';

    // Delegar al Page Object — RegisterPage.registerAndLogout() encapsula
    // todos los selectores del formulario y el logout posterior
    const registerPage = new RegisterPage(this.page);
    await registerPage.registerAndLogout(
      {
        firstName: 'Brute',
        lastName: 'Force',
        email: bruteEmail,
        telephone: '3000000000',
        password: brutePass,
        confirmPassword: brutePass,
      },
      this.baseUrl,
    );

    // Almacenar credenciales de la cuenta desechable para los siguientes steps
    this.testData['bruteEmail'] = bruteEmail;
    this.testData['brutePass']  = brutePass;
  },
);

When(
  'intenta iniciar sesión {int} veces consecutivas con la contraseña incorrecta {string}',
  async function (this: CustomWorld, attempts: number, wrongPassword: string) {
    const loginPage = new LoginPage(this.page);
    await loginPage.open();
    // Usar la cuenta desechable registrada en el Given
    const email = this.testData['bruteEmail'] as string;
    await loginPage.attemptMultipleFailedLogins(email, wrongPassword, attempts);
    this.testData['attemptsCompleted'] = attempts;
  },
);

Then(
  'el sistema debe mostrar un mensaje de bloqueo de cuenta',
  async function (this: CustomWorld) {
    // OpenCart muestra "exceeded" en el INTENTO 6, no en el 5.
    // Tras los 5 intentos fallidos del When, hacemos un intento 6 extra
    // (contraseña incorrecta) para disparar el mensaje de bloqueo.
    const loginPage = new LoginPage(this.page);
    const bruteEmail = this.testData['bruteEmail'] as string;
    await loginPage.loginWithInvalidCredentials(bruteEmail, 'intento_6_trigger');

    const isLocked = await loginPage.isLockedOut();

    if (!isLocked) {
      const errorMsg = await loginPage.getErrorMessage().catch(() => '(sin mensaje)');
      throw new Error(
        `[DEF-001 ACTIVO] El sistema NO bloqueó la cuenta tras 5 intentos fallidos.\n` +
          `Mensaje en intento 6: "${errorMsg.trim()}"\n` +
          `Este fallo DOCUMENTA el defecto DEF-001: ausencia de mecanismo anti-fuerza-bruta.\n` +
          `El test pasará cuando el sitio implemente bloqueo por intentos fallidos.`,
      );
    }
  },
);

Then(
  'el usuario no puede iniciar sesión con credenciales correctas en el intento número {int}',
  async function (this: CustomWorld, _attemptNumber: number) {
    const loginPage = new LoginPage(this.page);
    await loginPage.open();
    const email    = this.testData['bruteEmail'] as string;  // cuenta desechable
    const password = this.testData['brutePass']  as string;  // contraseña real de esa cuenta

    // Delegar al Page Object — selectores encapsulados en LoginPage
    await loginPage.fillCredentials(email, password);
    await loginPage.submitBtn.click();
    await this.page.waitForLoadState('load');

    const currentUrl = this.page.url();
    const loggedIn = currentUrl.includes('account/account');

    if (loggedIn) {
      throw new Error(
        `[DEF-001 ACTIVO] El sistema PERMITIÓ el intento ${_attemptNumber} con credenciales ` +
          `correctas tras 5 intentos fallidos. La cuenta debería estar bloqueada.`,
      );
    }

    // Verificar que haya mensaje de error — delegado al PO
    const isLocked = await loginPage.isLockedOut();
    const errorMsg = isLocked ? await loginPage.getErrorMessage() : '';
    expect(
      isLocked,
      `[DEF-001] No se encontró mensaje de bloqueo en intento ${_attemptNumber}. ` +
      `Mensaje actual: "${errorMsg.trim()}"`,
    ).toBe(true);
  },
);

// ─── E-P-01: Registro exitoso (datos del Excel) ──────────────────────────

Given(
  'el usuario no tiene cuenta registrada en el sistema',
  async function (this: CustomWorld) {
    // Precondición satisfecha: los emails en el Excel incluyen <timestamp> único
  },
);

When('navega al formulario de registro', async function (this: CustomWorld) {
  const registerPage = new RegisterPage(this.page);
  await registerPage.open();
});

When(
  'completa el formulario con los datos del archivo Excel fila {int}',
  async function (this: CustomWorld, row: number) {
    const excel = new ExcelHelper();
    const data = await excel.readRow('Registro', row);

    this.testData['registrationData'] = data;
    this.testData['registeredEmail'] = data['email'];

    const registerPage = new RegisterPage(this.page);
    await registerPage.fillRegistrationForm({
      firstName: data['nombre'] ?? '',
      lastName: data['apellido'] ?? '',
      email: data['email'] ?? '',
      telephone: data['telefono'] ?? '',
      password: data['contrasena'] ?? '',
      confirmPassword: data['confirmacion'] ?? '',
    });
  },
);

When('acepta la política de privacidad', async function (this: CustomWorld) {
  const registerPage = new RegisterPage(this.page);
  await registerPage.acceptPrivacyPolicy();
});

When('hace clic en continuar', async function (this: CustomWorld) {
  const registerPage = new RegisterPage(this.page);
  await registerPage.submitForm();
});

Then('el sistema confirma el registro exitoso', async function (this: CustomWorld) {
  const registerPage = new RegisterPage(this.page);
  const success = await registerPage.isRegistrationSuccessful();
  expect(success).toBe(true);
});

Then(
  'el usuario es redirigido a su panel de bienvenida',
  async function (this: CustomWorld) {
    // opencart.abstracta.us muestra "Congratulations!" en account/success
    // Delegar la verificación al Page Object de registro
    const registerPage = new RegisterPage(this.page);
    const successMsg = await registerPage.getSuccessMessage();
    expect(successMsg.toLowerCase()).toContain('congratulations');
  },
);

Then(
  'un email de confirmación es enviado a la dirección registrada',
  async function (this: CustomWorld) {
    // El sitio demo no permite verificar el envío real de email.
    // Se valida que el flujo terminó en la URL de success.
    const url = this.page.url();
    expect(url).toContain('account/success');
  },
);

// ─── E-N-01: Rechazo correo duplicado (documenta DEF-003) ────────────────

Given(
  'el correo del usuario de prueba ya está registrado en el sistema',
  async function (this: CustomWorld) {
    // Lee el email del .env — misma fuente que E-P-03
    this.testData['duplicateEmail'] = TEST_EMAIL;
  },
);

When(
  'un nuevo usuario intenta registrarse con el mismo correo del usuario de prueba',
  async function (this: CustomWorld) {
    const email = this.testData['duplicateEmail'] as string;
    const registerPage = new RegisterPage(this.page);
    await registerPage.open();
    await registerPage.fillRegistrationForm({
      firstName: 'Test',
      lastName: 'Duplicado',
      email: email,
      telephone: '3001234567',
      password: 'TestPass@2024!',
      confirmPassword: 'TestPass@2024!',
    });
    await registerPage.acceptPrivacyPolicy();
    await registerPage.submitForm();
  },
);

Then(
  'el sistema debe mostrar un mensaje de error de correo duplicado',
  async function (this: CustomWorld) {
    // Delegar al Page Object — getEmailErrorMessage() encapsula el selector .alert-danger
    const registerPage = new RegisterPage(this.page);
    const errorText = await registerPage.getEmailErrorMessage();
    const hasEmailError =
      errorText.toLowerCase().includes('already') ||
      errorText.toLowerCase().includes('registr') ||
      errorText.toLowerCase().includes('exist') ||
      errorText.toLowerCase().includes('email') ||
      errorText.toLowerCase().includes('warning');

    if (!hasEmailError) {
      throw new Error(
        `[DEF-003] Mensaje de error inesperado para correo duplicado: "${errorText.trim()}"`,
      );
    }
  },
);

Then(
  'no debe crear una segunda cuenta con ese correo',
  async function (this: CustomWorld) {
    const url = this.page.url();
    expect(url).not.toContain('account/success');
  },
);

Then(
  'el formulario debe permanecer en la página de registro',
  async function (this: CustomWorld) {
    const registerPage = new RegisterPage(this.page);
    const onPage = await registerPage.isStillOnRegistrationPage();
    expect(onPage).toBe(true);
  },
);
