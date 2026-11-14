# Spec Delta

## Purpose

Define cómo el usuario llega a la hoja "Pendientes" (cobros por confirmar y pagos de tarjeta vencidos) y cómo la usa: el acceso desde el balance, la apertura automática y posponer durante la sesión.

## ADDED Requirements

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

### Requirement: Posponer durante la sesión
Al elegir "Aún no" en una tarjeta, esa tarjeta SHALL desaparecer de la hoja en ese momento y el número de la campana SHALL bajar. Lo pospuesto SHALL NOT volver a mostrarse ni contarse hasta la siguiente apertura de la app. Si ya no quedan pendientes, la hoja SHALL cerrarse y la campana SHALL quedar inactiva.

#### Scenario: Posponer uno de dos
- **WHEN** la hoja muestra el cobro de Luz CFE y el pago de BBVA Azul, y el usuario elige "Aún no" en Luz CFE
- **THEN** la tarjeta de Luz CFE desaparece, queda la de BBVA Azul y la campana muestra 1

#### Scenario: Posponer el último
- **WHEN** queda un solo pendiente y el usuario elige "Aún no"
- **THEN** la hoja se cierra y la campana queda tenue

#### Scenario: Siguiente apertura
- **WHEN** el usuario pospuso el cobro de Luz CFE, cierra la app y la vuelve a abrir
- **THEN** la campana vuelve a contar Luz CFE y la hoja lo pregunta de nuevo

### Requirement: Apertura automática
Al quedar visible el balance tras abrir la app, si hay pendientes, la hoja "Pendientes" SHALL abrirse sola una vez por apertura. Después de cerrarla, el usuario SHALL poder volver a abrirla con la campana.

#### Scenario: Cerrar y volver
- **WHEN** la hoja se abrió sola, el usuario la cierra sin responder y luego toca la campana
- **THEN** la hoja se abre de nuevo con los mismos pendientes

### Requirement: Orden de las acciones en cada tarjeta
En cada tarjeta de la hoja, "Aún no" SHALL ser la primera acción de su fila, a la izquierda. La acción que confirma SHALL ir a la derecha o en la fila de abajo. La tarjeta de cobro SHALL mostrar "Aún no" y "No se cobró" en una fila y "Sí, se cobró" debajo, a todo lo ancho. La tarjeta de pago SHALL mostrar "Aún no" y "Sí, pagué" en una fila, en ese orden.

#### Scenario: Tarjeta de cobro
- **WHEN** la hoja muestra un cobro por confirmar
- **THEN** la primera fila de botones es "Aún no", "No se cobró" y debajo está "Sí, se cobró"

#### Scenario: Tarjeta de pago
- **WHEN** la hoja muestra un pago de tarjeta vencido
- **THEN** la fila de botones es "Aún no" a la izquierda y "Sí, pagué" a la derecha
