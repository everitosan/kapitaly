# pending-review Specification

## Purpose
Define cómo el usuario llega a la hoja "Pendientes" (cobros por confirmar y pagos de tarjeta vencidos) y cómo la usa: el acceso desde el balance, la apertura automática y posponer por 6 horas.

## Requirements

### Requirement: Campana de pendientes
La barra superior del balance SHALL mostrar un botón de pendientes con una campana, junto a Métodos de pago y Ajustes. Con al menos un pendiente sin posponer, el botón SHALL mostrarse activo, con tinte rojo y el número de pendientes, y al tocarlo SHALL abrir la hoja "Pendientes". Sin pendientes, SHALL mostrarse tenue y SHALL NOT responder al toque.

#### Scenario: Con pendientes
- **WHEN** hay un cobro por confirmar y un pago de tarjeta vencido
- **THEN** la campana se ve activa con el número 2 y, al tocarla, se abre la hoja "Pendientes" con las dos tarjetas

#### Scenario: Sin pendientes
- **WHEN** no hay cobros por confirmar ni pagos vencidos
- **THEN** la campana se ve tenue, tocarla no abre nada y el lector de pantalla la anuncia como sin pendientes

#### Scenario: Sin aviso en la lista
- **WHEN** hay pendientes y el usuario ve el balance
- **THEN** no aparece ningún aviso de pendientes entre el selector "Este mes | Análisis" y la tarjeta del mes

### Requirement: Contraste de la campana
El número y el ícono de la campana activa SHALL tener un contraste de al menos 4.5:1 con su fondo, en tema claro y en tema oscuro.

#### Scenario: Tema oscuro
- **WHEN** el sistema está en modo oscuro y hay pendientes
- **THEN** el número de la campana tiene un contraste de al menos 4.5:1 con el tinte rojo de fondo

### Requirement: Posponer 6 horas
Al elegir "Posponer" en una tarjeta, esa tarjeta SHALL desaparecer de la hoja en ese momento, el número de la campana SHALL bajar y SHALL mostrarse "Volveré a avisarte dentro de 6 hrs". Lo pospuesto SHALL NOT mostrarse ni contarse durante 6 horas, aunque se cierre y se vuelva a abrir la app. Pasado el plazo, SHALL volver con la opción de posponer otra vez. Si ya no quedan pendientes, la hoja SHALL cerrarse y la campana SHALL quedar inactiva.

#### Scenario: Posponer uno de dos
- **WHEN** la hoja muestra el cobro de Luz CFE y el pago de BBVA Azul, y el usuario elige "Posponer" en Luz CFE
- **THEN** la tarjeta de Luz CFE desaparece, queda la de BBVA Azul, la campana muestra 1 y aparece "Volveré a avisarte dentro de 6 hrs"

#### Scenario: Posponer el último
- **WHEN** queda un solo pendiente y el usuario elige "Posponer"
- **THEN** la hoja se cierra y la campana queda tenue

#### Scenario: Abrir la app dentro del plazo
- **WHEN** a las 10:00 el usuario pospone el cobro de Luz CFE, cierra la app y la vuelve a abrir a las 13:00
- **THEN** Luz CFE no aparece en la hoja ni cuenta en la campana

#### Scenario: Pasado el plazo
- **WHEN** a las 10:00 el usuario pospone el cobro de Luz CFE y abre la app a las 16:05
- **THEN** la campana vuelve a contar Luz CFE y la hoja lo pregunta de nuevo, con la opción de posponer

#### Scenario: Plazo vencido con la app abierta
- **WHEN** el usuario pospone Luz CFE y la app queda en segundo plano más de 6 horas
- **THEN** al volver a la app, Luz CFE vuelve a contar en la campana

### Requirement: Apertura automática
Al abrir la app, si hay pendientes sin posponer, la hoja "Pendientes" SHALL abrirse sola cuando el balance quede visible. Al cerrarla con "Cerrar" sin responder, la hoja SHALL NOT volver a abrirse sola durante 6 horas, aunque se cierre y se vuelva a abrir la app; los pendientes SHALL seguir contando en la campana, y el usuario SHALL poder abrir la hoja con la campana en cualquier momento.

#### Scenario: Cerrar y volver
- **WHEN** la hoja se abrió sola, el usuario la cierra sin responder y luego toca la campana
- **THEN** la hoja se abre de nuevo con los mismos pendientes

#### Scenario: Cerrar y volver a abrir la app
- **WHEN** a las 9:00 el usuario cierra la hoja sin responder, sale de la app y la abre de nuevo a las 11:00
- **THEN** la hoja no se abre sola y la campana sigue mostrando el número de pendientes

#### Scenario: Pasadas 6 horas de cerrar la hoja
- **WHEN** a las 9:00 el usuario cerró la hoja sin responder y abre la app a las 15:30 con pendientes sin posponer
- **THEN** la hoja vuelve a abrirse sola

### Requirement: Orden de las acciones en cada tarjeta
En cada tarjeta de la hoja, "Posponer" SHALL ser la primera acción de su fila, a la izquierda. La acción que confirma SHALL ir a la derecha o en la fila de abajo. La tarjeta de cobro SHALL mostrar "Posponer" y "No se cobró" en una fila y "Sí, se cobró" debajo, a todo lo ancho. La tarjeta de pago SHALL mostrar "Posponer" y "Sí, pagué" en una fila, en ese orden.

#### Scenario: Tarjeta de cobro
- **WHEN** la hoja muestra un cobro por confirmar
- **THEN** la primera fila de botones es "Posponer", "No se cobró" y debajo está "Sí, se cobró"

#### Scenario: Tarjeta de pago
- **WHEN** la hoja muestra un pago de tarjeta vencido
- **THEN** la fila de botones es "Posponer" a la izquierda y "Sí, pagué" a la derecha
