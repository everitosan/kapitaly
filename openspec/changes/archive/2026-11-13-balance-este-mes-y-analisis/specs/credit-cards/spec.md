# Spec Delta

## MODIFIED Requirements

### Requirement: Registrar un pago de tarjeta
Desde Métodos de pago, el sistema SHALL permitir "Pagar tarjeta" con un monto mayor que cero y una fecha (hoy por defecto), proponiendo como monto el usado actual si es positivo. El pago SHALL restarse del usado y, si la tarjeta tiene día de pago, SHALL cubrir la fecha de pago más cercana a la fecha del pago (en empate, la posterior). Los pagos no SHALL contarse como gastos en el balance del mes.

#### Scenario: Pago total
- **WHEN** el usado es $12,457.50 y el usuario paga $12,457.50
- **THEN** el usado queda en $0.00

#### Scenario: Pago tardío cubre la fecha vencida
- **WHEN** el día de pago es 5 y el usuario registra un pago con fecha 07/11/2026
- **THEN** el pago cubre la fecha de pago del 05/11/2026

#### Scenario: Pago parcial
- **WHEN** el usado es $12,457.50 y el usuario paga $5,000.00
- **THEN** el usado queda en $7,457.50

#### Scenario: Los pagos no son gastos
- **WHEN** el usuario registra un pago de tarjeta en noviembre 2026
- **THEN** lo efectuado, lo proyectado y los cargos de "Este mes" y el costo mensual promedio de "Análisis" de noviembre no cambian
