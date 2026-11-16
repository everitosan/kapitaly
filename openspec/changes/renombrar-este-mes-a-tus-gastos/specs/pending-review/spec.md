## MODIFIED Requirements

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
- **THEN** no aparece ningún aviso de pendientes entre el selector "Tus gastos | Análisis" y la tarjeta del mes
