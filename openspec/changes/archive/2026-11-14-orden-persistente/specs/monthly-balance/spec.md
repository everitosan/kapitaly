# Spec Delta

## MODIFIED Requirements

### Requirement: Orden de la lista de Este mes
La lista de "Este mes" SHALL ordenarse por fecha de cobro de la más antigua a la más reciente; en la misma fecha, por la hora en que se registró el gasto y luego por nombre. Un botón SHALL invertir el orden y mostrar el orden vigente. El orden elegido SHALL conservarse al cerrar y volver a abrir la app; sin uno elegido, SHALL ser de la más antigua a la más reciente.

#### Scenario: Mismo día
- **WHEN** el 11/11/2026 hay dos gastos únicos, "Tacos" registrado a las 14:20 y "Súper" registrado a las 18:47
- **THEN** "Tacos" aparece antes que "Súper"

#### Scenario: Invertir el orden
- **WHEN** el usuario toca el botón de orden
- **THEN** la lista muestra primero el cargo más reciente y el botón indica "Más reciente"

#### Scenario: Orden conservado al volver a abrir la app
- **WHEN** el usuario cambia el orden a "Más reciente", cierra la app y la vuelve a abrir
- **THEN** la lista de "Este mes" muestra primero el cargo más reciente y el botón indica "Más reciente"

#### Scenario: Sin orden elegido
- **WHEN** el usuario abre la app por primera vez
- **THEN** la lista muestra primero el cargo más antiguo y el botón indica "Más antiguo"
