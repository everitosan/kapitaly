# Spec Delta

## MODIFIED Requirements

### Requirement: Registrar un gasto recurrente
El sistema SHALL permitir crear un gasto recurrente con nombre, monto, frecuencia, fecha de cobro (fecha ancla), método de pago y categoría, y opcionalmente una fecha de fin. La categoría SHALL proponerse como "Otro"; solo se ofrecen categorías vigentes y no ocultas. Sus cobros SHALL usar siempre la categoría actual del gasto. El gasto creado SHALL aparecer de inmediato en el balance.

#### Scenario: Alta exitosa
- **WHEN** el usuario captura nombre "Netflix", monto $219.00, frecuencia Mensual, fecha de cobro 15/11/2026 y método "BBVA Azul" y guarda
- **THEN** el gasto queda registrado y se muestra en el balance de noviembre 2026 con un cargo el 15 de noviembre por $219.00 pagado con "BBVA Azul"

#### Scenario: Alta con fecha de fin
- **WHEN** el usuario registra un gasto mensual desde 01/01/2026 con fecha de fin 31/03/2026
- **THEN** el gasto genera cargos en enero, febrero y marzo de 2026 y ninguno a partir de abril

#### Scenario: Categoría por defecto
- **WHEN** el usuario registra "Netflix" sin elegir categoría
- **THEN** el gasto queda con la categoría "Otro"

#### Scenario: Reclasificar también los meses anteriores
- **WHEN** "Netflix" tiene cobros confirmados en octubre y noviembre 2026 y el usuario cambia su categoría de "Otro" a "Suscripciones"
- **THEN** los cobros de octubre y noviembre se muestran con "Suscripciones"
