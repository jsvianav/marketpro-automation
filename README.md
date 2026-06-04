# MarketPro+ — Automatizacion de Pruebas

Stack: Playwright + Cucumber + TypeScript + ExcelJS
Metodologia: Risk-Based Testing (ISTQB) / ISO/IEC/IEEE 29119

---

## Sitio objetivo

https://opencart.abstracta.us — instancia publica de OpenCart sin proteccion anti-bot.


---

## Prerrequisitos

- Node.js 18 o superior
- npm 9 o superior

---

## Instalacion

```
npm install
npx playwright install chromium
```

---

## Ejecucion

```
# Todos los escenarios
npm test

# Solo autenticacion
npm run test:autenticacion

# Solo campanas
npm run test:campanas

# Con reporte HTML
npm run test:report

# Modo visible (para depuracion)
HEADLESS=false npm test
```

Para correr un tag especifico:

```
npx cucumber-js --tags "@E-P-03"
npx cucumber-js --tags "@registro"
npx cucumber-js --tags "@E-N-03"
npx cucumber-js --tags "@campanas"
```

---

## Estructura del proyecto

```
marketpro-automation/
├── features/
│   ├── autenticacion.feature     (E-P-03, E-N-03, E-P-01, E-N-01)
│   └── campanas.feature          (E-P-05)
├── step-definitions/
│   ├── autenticacion.steps.ts
│   ├── campanas.steps.ts
│   └── hooks.ts
├── src/
│   ├── pages/                    (Page Object Model)
│   ├── utils/                    (ExcelHelper, TestDataGenerator)
│   └── world/                    (CustomWorld de Cucumber)
└── test-data/
    └── datos_prueba.xlsx         (Datos parametrizados)
```

---

## Modelo de simulacion (OpenCart -> MarketPro+)

| OpenCart            | MarketPro+                   |
|---------------------|------------------------------|
| Login / Registro    | Acceso a la plataforma       |
| Producto            | Campana de marketing         |
| Agregar al carrito  | Configurar campana           |
| Checkout            | Activar campana              |
| Email del usuario   | Credencial unica del marketer|

---

## Los 5 escenarios

### E-P-03 — Login exitoso (POSITIVO)
- Riesgo: R-01 Autenticacion (P=9)
- HU/Caso: US-203 / TC-F03-001
- Valida: login con credenciales validas en menos de 3 segundos
- Resultado esperado: PASS

### E-N-03 — Bloqueo por fuerza bruta (NEGATIVO)
- Riesgo: R-01 Autenticacion (P=9)
- HU/Caso: US-203 / TC-F03-003
- Valida: que el sistema bloquee la cuenta tras 5 intentos fallidos
- Resultado esperado: PASS (el sitio SI implementa lockout)
- Nota: usa una cuenta desechable por ejecucion para no afectar test5@testing.com

### E-P-01 — Registro exitoso con datos del Excel (POSITIVO)
- Riesgo: R-01 Autenticacion (P=9)
- HU/Caso: US-201 / TC-F01-001
- Valida: registro exitoso con filas 1 y 2 del Excel (emails con timestamp unico)
- Resultado esperado: PASS (2 ejemplos del Scenario Outline)

### E-N-01 — Rechazo correo duplicado (NEGATIVO)
- Riesgo: R-01 Autenticacion (P=9)
- HU/Caso: US-201 / TC-F01-004
- Valida: que el sistema rechace un correo ya registrado
- Resultado esperado: PASS

### E-P-05 — Activacion de campana (POSITIVO)
- Riesgo: R-04 Disponibilidad (P=6)
- HU/Caso: US-312 / TC-F09-001
- Valida: flujo completo busqueda -> detalle -> carrito -> checkout
- El numero de confirmacion se escribe automaticamente en el Excel
- Resultado esperado: PASS

---

## Cuentas de prueba

| Variable env    | Email                              | Password         | Usada en      |
|-----------------|------------------------------------|------------------|---------------|
| TEST_EMAIL      | test5@testing.com                  | test5@testing.com| E-P-03        |
| CAMPAIGN_EMAIL  | marketpro_1780415921125@test.com   | MarketPro@2024!  | E-P-05        |

Nota: E-N-03 crea una cuenta desechable (bruteforce_<timestamp>@test.com)
por cada ejecucion, de modo que nunca bloquea test5@testing.com.

---

## Nota sobre lockout de E-P-03

El sitio bloquea cuentas 1 hora tras 5 intentos fallidos.
Si test5@testing.com esta bloqueada, E-P-03 falla con mensaje claro.

Para evitarlo: esperar 1 hora entre ejecuciones completas del suite.
E-N-03 ya NO bloquea test5 (usa cuenta temporal propia).

---

## Interpretacion del reporte HTML

El reporte se genera en reports/report.html. Abrirlo en cualquier navegador.

- Verde (Passed): el escenario cumplio todos los criterios de aceptacion.
- Rojo (Failed):
  - Si es E-P-03: la cuenta test5 esta en lockout temporal. Esperar 1 hora.
  - Si es cualquier otro: ver el step fallido y el screenshot adjunto en el reporte.
- Los screenshots se capturan automaticamente al fallar y quedan embebidos en el reporte.
