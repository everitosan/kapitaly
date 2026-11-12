# Spec Delta

## MODIFIED Requirements

### Requirement: Registrar un gasto único
El sistema SHALL permitir crear un gasto único con descripción libre, monto, fecha, método de pago y categoría. La descripción es texto libre, no una selección de un catálogo. La fecha SHALL proponerse como la de hoy y la categoría como "Otro"; solo se ofrecen categorías vigentes y no ocultas. El gasto creado SHALL aparecer de inmediato en el balance del mes de su fecha.

#### Scenario: Alta rápida
- **WHEN** hoy es 11/11/2026 y el usuario registra "Recarga metro" por $100.00 con "Efectivo" sin cambiar la fecha
- **THEN** el gasto queda registrado con fecha 11/11/2026 y aparece en el balance de noviembre 2026

#### Scenario: Fecha pasada
- **WHEN** el usuario registra "Comida con amigos" por $450.00 con fecha 30/10/2026
- **THEN** el gasto aparece en el balance de octubre 2026 y no en el de noviembre

#### Scenario: Categoría por defecto
- **WHEN** el usuario registra "Recarga metro" sin elegir categoría
- **THEN** el gasto queda con la categoría "Otro"

#### Scenario: Elegir categoría
- **WHEN** el usuario registra "Comida con amigos" y elige "Comida" en el selector de categoría
- **THEN** el gasto queda con la categoría "Comida"
