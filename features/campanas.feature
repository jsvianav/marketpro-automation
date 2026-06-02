# Feature: Activación de campañas en MarketPro+
# HU: US-312 | Caso: TC-F09-001
# Riesgo: R-04 Disponibilidad (P=6)
# Mapeo: Producto = Campaña | Carrito = Configurar | Checkout = Activar

@campanas
Feature: Activación de campañas en MarketPro+

  # ─────────────────────────────────────────────────────────────────────────
  # E-P-05 | TC-F09-001 | POSITIVO | Activación exitosa de campaña
  # ─────────────────────────────────────────────────────────────────────────
  @positivo @activacion @E-P-05
  Scenario: Activación exitosa de campaña completamente configurada
    Given el marketer ha iniciado sesión en MarketPro+
    And existe una campaña disponible "MacBook" en el catálogo
    When navega al detalle de la campaña
    And configura la campaña con cantidad 1
    And hace clic en "Activar campaña" (Add to Cart)
    And procede a la confirmación de activación (checkout)
    And completa los datos de activación con los datos del archivo Excel
    Then la campaña cambia su estado a "Activa" (Order Confirmed)
    And el sistema muestra el número de confirmación de activación
    And se registra la activación en el historial del marketer
