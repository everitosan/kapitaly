# credit-cards Specification

## Purpose

Lleva la cuenta de lo usado en cada tarjeta de crédito (saldo inicial, gastos, cobros confirmados y pagos), protege su límite de la vista y avisa en la fecha de pago para registrar cuánto se pagó.

## Requirements

### Requirement: Datos de una tarjeta de crédito
Al registrar o editar un método de tipo crédito, el sistema SHALL permitir capturar el saldo inicial (monto usado al inicio del día de registro, por defecto $0.00), el límite de crédito (opcional) y el día de pago del mes (opcional, de 1 a 31). SHALL rechazar un saldo inicial negativo o con más de dos decimales, un límite no mayor que cero y un día fuera de 1 a 31. Estos datos no aplican a otros tipos.

#### Scenario: Alta de tarjeta con saldo, límite y día de pago
- **WHEN** el 01/11/2026 el usuario registra "BBVA Azul", tipo crédito, saldo inicial $12,000.00, límite $50,000.00 y día de pago 5
- **THEN** la tarjeta se guarda con esos datos y su usado es $12,000.00

#### Scenario: Día de pago inválido
- **WHEN** el usuario captura 32 como día de pago
- **THEN** el sistema no guarda la tarjeta e indica que el día debe estar entre 1 y 31

#### Scenario: Otros tipos no piden estos datos
- **WHEN** el usuario registra un método de tipo débito
- **THEN** el formulario no muestra saldo inicial, límite ni día de pago

### Requirement: Cálculo del usado
El usado de una tarjeta SHALL ser: saldo inicial + gastos únicos vigentes con esa tarjeta y fecha igual o posterior a la del saldo inicial + cobros recurrentes confirmados con esa tarjeta y fecha igual o posterior − pagos vigentes de la tarjeta. Si el resultado es negativo, SHALL mostrarse como saldo a favor.

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

### Requirement: Privacidad del límite
El usado SHALL mostrarse siempre. El límite y el disponible (límite − usado) SHALL mostrarse ocultos con puntos hasta que el usuario los toque, y SHALL volver a ocultarse al salir de la pantalla. Estos datos SHALL mostrarse solo en Métodos de pago, nunca en el balance del mes.

#### Scenario: Límite oculto
- **WHEN** el usuario abre la lista de métodos de pago
- **THEN** ve el usado de "BBVA Azul" y el límite y el disponible como "••••••"

#### Scenario: Mostrar al tocar
- **WHEN** el usuario toca el límite oculto
- **THEN** se muestran el límite $50,000.00 y el disponible correspondiente, y vuelven a ocultarse al salir y regresar a la pantalla

### Requirement: Próximo pago
Si la tarjeta tiene día de pago, el sistema SHALL mostrar en Métodos de pago la próxima fecha de pago: la primera, igual o posterior a hoy, con ese día (ajustado al último día en meses más cortos).

#### Scenario: Próxima fecha
- **WHEN** el día de pago es 5 y hoy es 11/11/2026
- **THEN** la tarjeta muestra "Próximo pago: 5 dic 2026"

#### Scenario: Día 31 en mes corto
- **WHEN** el día de pago es 31 y hoy es 01/11/2026
- **THEN** la tarjeta muestra "Próximo pago: 30 nov 2026"

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
- **THEN** el total y los cargos de "Este mes" y de "Promedio" de noviembre no cambian

### Requirement: Aviso en la fecha de pago
Al abrir la app, por cada tarjeta con día de pago, usado mayor que cero y cuya fecha de pago más reciente ya llegó (y es igual o posterior a la del saldo inicial) sin pago asociado, el sistema SHALL preguntar si ya se pagó, con el monto propuesto igual al usado y editable. "Sí, pagué" SHALL registrar el pago asociado a esa fecha; "Aún no" SHALL volver a preguntar en la siguiente apertura.

#### Scenario: Aviso al llegar la fecha
- **WHEN** el día de pago de "BBVA Azul" es 5, hoy es 05/12/2026, el usado es $7,457.50 y no hay pago para el 05/12/2026
- **THEN** la app pregunta "¿Ya pagaste BBVA Azul?" con $7,457.50 propuesto

#### Scenario: Pagar desde Métodos de pago evita el aviso
- **WHEN** el 03/12/2026 el usuario registra un pago de "BBVA Azul" y la próxima fecha de pago es el 05/12/2026
- **THEN** el 05/12/2026 la app no pregunta por el pago de esa tarjeta

#### Scenario: Aún no
- **WHEN** la app pregunta por el pago y el usuario elige "Aún no"
- **THEN** no se registra ningún pago y la pregunta vuelve a aparecer la próxima vez que abra la app

#### Scenario: Sin aviso con usado en cero
- **WHEN** llega la fecha de pago y el usado de la tarjeta es $0.00 o un saldo a favor
- **THEN** la app no pregunta por el pago

### Requirement: Historial de pagos
En el detalle de una tarjeta de crédito, el sistema SHALL listar sus pagos (fecha y monto) y SHALL permitir eliminar uno con confirmación, lo que lo deja de restar del usado.

#### Scenario: Eliminar un pago registrado por error
- **WHEN** el usuario elimina un pago de $5,000.00 y confirma
- **THEN** el pago desaparece del historial y el usado aumenta $5,000.00
