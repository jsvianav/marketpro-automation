# Feature: Autenticación de usuarios en MarketPro+
# HU: US-203 (Login) | US-201 (Registro)
# Riesgo: R-01 Autenticación (P=9) — prioridad máxima

@autenticacion
Feature: Autenticación de usuarios en MarketPro+

  # ─────────────────────────────────────────────────────────────────────────
  # E-P-03 | TC-F03-001 | POSITIVO | Login exitoso
  # ─────────────────────────────────────────────────────────────────────────
  @positivo @login @E-P-03
  Scenario: Login exitoso con credenciales válidas
    Given el usuario registrado existe en el sistema
    When navega a la página de login de MarketPro+
    And ingresa las credenciales del usuario de prueba
    And hace clic en el botón de iniciar sesión
    Then el sistema concede acceso al panel principal
    And el nombre del usuario es visible en la pantalla
    And el acceso ocurre en menos de 3000 milisegundos

  # ─────────────────────────────────────────────────────────────────────────
  # E-N-03 | TC-F03-003 | NEGATIVO | Bloqueo por fuerza bruta
  # DOCUMENTA: DEF-001 — El sitio demo NO bloquea cuentas.
  # Este test DEBE fallar mientras el defecto esté activo.
  # ─────────────────────────────────────────────────────────────────────────
  @negativo @login @E-N-03 @DEF-001
  Scenario: El sistema debe bloquear la cuenta tras 5 intentos fallidos de login
    Given el usuario de prueba está registrado en el sistema
    When intenta iniciar sesión 5 veces consecutivas con la contraseña incorrecta "contrasena_incorrecta_123"
    Then el sistema debe mostrar un mensaje de bloqueo de cuenta
    And el usuario no puede iniciar sesión con credenciales correctas en el intento número 6

  # ─────────────────────────────────────────────────────────────────────────
  # E-P-01 | TC-F01-001 | POSITIVO | Registro exitoso (datos del Excel)
  # ─────────────────────────────────────────────────────────────────────────
  @positivo @registro @E-P-01
  Scenario Outline: Registro exitoso de nuevo cliente en MarketPro+
    Given el usuario no tiene cuenta registrada en el sistema
    When navega al formulario de registro
    And completa el formulario con los datos del archivo Excel fila <row>
    And acepta la política de privacidad
    And hace clic en continuar
    Then el sistema confirma el registro exitoso
    And el usuario es redirigido a su panel de bienvenida
    And un email de confirmación es enviado a la dirección registrada

    Examples:
      | row |
      | 1   |
      | 2   |

  # ─────────────────────────────────────────────────────────────────────────
  # E-N-01 | TC-F01-004 | NEGATIVO | Rechazo correo duplicado
  # DOCUMENTA: DEF-003 — Verificar que el sistema muestre error de duplicado.
  # ─────────────────────────────────────────────────────────────────────────
  @negativo @registro @E-N-01 @DEF-003
  Scenario: El sistema debe rechazar el registro con un correo ya existente
    Given el correo del usuario de prueba ya está registrado en el sistema
    When un nuevo usuario intenta registrarse con el mismo correo del usuario de prueba
    Then el sistema debe mostrar un mensaje de error de correo duplicado
    And no debe crear una segunda cuenta con ese correo
    And el formulario debe permanecer en la página de registro
