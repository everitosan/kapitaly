# Spec Delta

## MODIFIED Requirements

### Requirement: Cálculo del usado
El usado de una tarjeta SHALL ser: saldo inicial + gastos únicos vigentes con esa tarjeta y fecha igual o posterior a la del saldo inicial + cobros recurrentes confirmados con esa tarjeta y fecha igual o posterior − pagos vigentes de la tarjeta. Los gastos únicos y cobros confirmados marcados como "no sumar al saldo de la tarjeta" SHALL excluirse del usado porque ya venían incluidos en el saldo inicial. Si el resultado es negativo, SHALL mostrarse como saldo a favor.

#### Scenario: Usado con gastos y un cobro confirmado
- **WHEN** "BBVA Azul" tiene saldo inicial $12,000.00 al 01/11/2026, un gasto único de $238.50 el 09/11/2026 y el cobro de Netflix de $219.00 del 15/11/2026 confirmado
- **THEN** su usado es $12,457.50

#### Scenario: Física y digital suman al mismo usado
- **WHEN** "BBVA Azul" tiene un gasto único de $100.00 con la física y otro de $50.00 con la digital, ambos desde la fecha del saldo inicial de $0.00
- **THEN** su usado es $150.00

#### Scenario: Un cobro sin confirmar no cuenta
- **WHEN** el cobro de Netflix del 15/11/2026 aún no se confirma
- **THEN** el usado de "BBVA Azul" no incluye esos $219.00

#### Scenario: Gastos anteriores al saldo inicial no cuentan
- **WHEN** existe un gasto único con "BBVA Azul" fechado el 30/10/2026 y el saldo inicial es del 01/11/2026
- **THEN** ese gasto no se suma al usado

#### Scenario: Saldo a favor
- **WHEN** el usado es $500.00 y el usuario registra un pago de $700.00
- **THEN** la tarjeta muestra un saldo a favor de $200.00

#### Scenario: Gasto ya incluido en el saldo inicial
- **WHEN** "BBVA Azul" tiene saldo inicial $12,000.00 al 11/11/2026 y el usuario confirma el cobro de Netflix de $219.00 con "Sumar al saldo de la tarjeta" desactivado
- **THEN** su usado sigue en $12,000.00 y el cobro sí cuenta en el balance del mes
