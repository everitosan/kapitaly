# reminders Specification

## Purpose
Notificaciones locales que el usuario configura en Ajustes para no olvidar confirmar cobros ni registrar gastos: aviso el día de cada cobro, recordatorio diario y aviso por desuso, sin servidor.

## Requirements

### Requirement: Avisos apagados por omisión
Los tres avisos ("Avisar el día del cobro", "Recordatorio diario" y "Desuso") SHALL venir apagados en una instalación nueva, y la app SHALL NOT agendar ninguna notificación mientras estén apagados.

#### Scenario: Primera vez
- **WHEN** el usuario abre "Notificaciones" por primera vez
- **THEN** los tres interruptores están apagados y no hay notificaciones agendadas

### Requirement: Permiso al encender
Al encender un aviso sin permiso de notificaciones, la app SHALL pedir el permiso del sistema. Si el usuario lo concede, el aviso SHALL quedar encendido. Si lo niega, o el sistema lo tiene bloqueado, el aviso SHALL quedar apagado y la pantalla SHALL explicar que las notificaciones están bloqueadas, con un botón para abrir los ajustes del sistema.

#### Scenario: Permiso concedido
- **WHEN** el usuario enciende "Recordatorio diario" y acepta el permiso
- **THEN** el interruptor queda encendido y aparece su hora

#### Scenario: Permiso negado
- **WHEN** el usuario enciende "Recordatorio diario" y niega el permiso
- **THEN** el interruptor queda apagado y aparece el aviso "Notificaciones bloqueadas" con "Abrir ajustes del sistema"

### Requirement: Aviso el día del cobro
Con "Avisar el día del cobro" encendido, la app SHALL notificar, a la hora elegida (10:00 por omisión), cada día que tenga cobros recurrentes o vencimientos de tarjeta que estarían pendientes ese día. Los de un mismo día SHALL ir en una sola notificación. Un cobro ya confirmado o descartado, o un vencimiento ya pagado, SHALL NOT notificarse. Al tocar la notificación SHALL abrirse la hoja "Pendientes".

#### Scenario: Un cobro
- **WHEN** Netflix ($219.00 con BBVA Azul) se cobra el 15/11/2026 y la hora del aviso es 10:00
- **THEN** el 15/11/2026 cerca de las 10:00 llega "Hoy se cobra Netflix" con "$219.00 con BBVA Azul. Confírmalo cuando pase."

#### Scenario: Vencimiento de tarjeta
- **WHEN** BBVA Azul vence el 05/12/2026 con $7,457.50 usado y no tiene pago para esa fecha
- **THEN** el 05/12/2026 a la hora elegida llega "Hoy vence BBVA Azul" con el usado

#### Scenario: Varios el mismo día
- **WHEN** el 20/11/2026 se cobran "Seguro del auto" y "Gimnasio"
- **THEN** ese día llega una sola notificación que menciona los dos

#### Scenario: Confirmado antes de la hora
- **WHEN** el usuario confirma el cobro de Netflix del 15/11/2026 a las 8:00 y la hora del aviso es 10:00
- **THEN** a las 10:00 no llega el aviso de Netflix

#### Scenario: Tocar la notificación
- **WHEN** el usuario toca el aviso de cobros
- **THEN** la app abre el balance con la hoja "Pendientes"

### Requirement: Recordatorio diario
Con "Recordatorio diario" encendido, la app SHALL notificar todos los días a la hora elegida (21:00 por omisión) "¿Ya anotaste tus gastos de hoy?". Al tocarla SHALL abrirse el formulario de nuevo gasto en "Único", con el cursor en el monto.

#### Scenario: Cada día
- **WHEN** el recordatorio está encendido a las 21:00
- **THEN** cada día cerca de las 21:00 llega "¿Ya anotaste tus gastos de hoy?", aunque la app esté cerrada

#### Scenario: Tocar el recordatorio
- **WHEN** el usuario toca el recordatorio
- **THEN** se abre "Nuevo gasto" en "Único" con el teclado numérico en el monto

### Requirement: Aviso por desuso
Con "Desuso" encendido y *n* días configurados (3 por omisión, de 1 a 14), si pasan *n* días desde el último gasto registrado (único o recurrente) sin registrar otro, la app SHALL notificar "Llevas *n* días sin registrar gastos". SHALL repetirlo a los 2*n* y 3*n* días, y después SHALL NOT volver a avisar hasta que se registre un gasto. Registrar un gasto SHALL reiniciar la cuenta. Al tocarla SHALL abrirse el formulario de nuevo gasto.

#### Scenario: Sin registrar
- **WHEN** el último gasto se registró el 10/11/2026, *n* es 3 y la hora es 21:00
- **THEN** llegan avisos el 13/11, el 16/11 y el 19/11 cerca de las 21:00, y ninguno después

#### Scenario: Registrar reinicia la cuenta
- **WHEN** con *n* igual a 3 el usuario registra un gasto el 12/11/2026
- **THEN** no llega el aviso del 13/11 y el siguiente sería el 15/11

### Requirement: Hora del aviso por desuso
El aviso por desuso SHALL usar la hora del recordatorio diario, salvo que el usuario elija una hora propia. Con hora propia, la pantalla SHALL ofrecer volver a usar la del recordatorio diario.

#### Scenario: Hora compartida
- **WHEN** el recordatorio diario está a las 21:00 y el desuso no tiene hora propia
- **THEN** el desuso muestra "La del recordatorio diario · 21:00" y avisa a esa hora

#### Scenario: Cambiar la hora del diario
- **WHEN** el desuso usa la hora del recordatorio diario y el usuario la cambia a 20:30
- **THEN** el desuso también avisa a las 20:30

#### Scenario: Hora propia
- **WHEN** el usuario elige 08:00 para el desuso
- **THEN** el desuso avisa a las 08:00 aunque el diario siga a las 21:00, y aparece "Usar la del recordatorio diario"

### Requirement: Avisos al día con los datos
Las notificaciones agendadas SHALL reflejar las preferencias y los datos actuales: al cambiar una preferencia, al registrar, editar o eliminar un gasto, al confirmar un cobro, al registrar un pago y al abrir la app, la app SHALL reemplazar lo agendado. Al apagar un aviso, SHALL cancelarse todo lo que tenía agendado.

#### Scenario: Apagar
- **WHEN** el usuario apaga "Avisar el día del cobro"
- **THEN** no llega ninguno de los avisos de cobros que estaban agendados

#### Scenario: Nuevo recurrente
- **WHEN** con el aviso de cobros encendido el usuario registra un gasto recurrente que se cobra el día 25
- **THEN** el día 25 llega el aviso de ese cobro

### Requirement: Funcionar sin servidor
Las notificaciones SHALL agendarse en el propio teléfono, sin servidor ni conexión, y SHALL llegar aunque la app esté cerrada y después de reiniciar el teléfono.

#### Scenario: Teléfono reiniciado
- **WHEN** el recordatorio diario está encendido y el usuario reinicia el teléfono sin abrir la app
- **THEN** el recordatorio sigue llegando a su hora
