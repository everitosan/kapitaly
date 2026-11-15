# Spec Delta

## MODIFIED Requirements

### Requirement: Aviso en la fecha de pago
Al abrir la app, por cada tarjeta con día de pago, usado mayor que cero y cuya fecha de pago más reciente ya llegó (y es igual o posterior a la del saldo inicial) sin pago asociado, el sistema SHALL preguntar si ya se pagó, con el monto propuesto igual al usado y editable. "Sí, pagué" SHALL registrar el pago asociado a esa fecha; "Posponer" SHALL volver a preguntar pasadas 6 horas (ver `pending-review`).

#### Scenario: Aviso al llegar la fecha
- **WHEN** el día de pago de "BBVA Azul" es 5, hoy es 05/12/2026, el usado es $7,457.50 y no hay pago para el 05/12/2026
- **THEN** la app pregunta "¿Ya pagaste BBVA Azul?" con $7,457.50 propuesto

#### Scenario: Pagar desde Métodos de pago evita el aviso
- **WHEN** el 03/12/2026 el usuario registra un pago de "BBVA Azul" y la próxima fecha de pago es el 05/12/2026
- **THEN** el 05/12/2026 la app no pregunta por el pago de esa tarjeta

#### Scenario: Aún no
- **WHEN** la app pregunta por el pago y el usuario elige "Posponer"
- **THEN** no se registra ningún pago y la pregunta vuelve a aparecer pasadas 6 horas

#### Scenario: Sin aviso con usado en cero
- **WHEN** llega la fecha de pago y el usado de la tarjeta es $0.00 o un saldo a favor
- **THEN** la app no pregunta por el pago
