## ADDED Requirements

### Requirement: Detalle del método activo
Cada fila de "Por método" SHALL poder tocarse. Al tocarla SHALL abrirse debajo de ella una lista de solo lectura con fecha, concepto y monto de cada gasto que forma su cifra, con las mismas filas, fechas y orden que "Fechas y orden del detalle de categoría"; su suma SHALL ser igual al monto del método. Solo SHALL haber un método abierto; tocarlo otra vez SHALL cerrarlo.

#### Scenario: Abrir el detalle de un método
- **WHEN** hoy es 11/11/2026, en noviembre 2026 Netflix ($219.00 mensual, día 15) y el Seguro anual ($6,000.00, fecha de cobro 15/03/2026) se pagan con "BBVA Azul", y el usuario toca "BBVA Azul" en "Por método"
- **THEN** debajo de BBVA Azul aparece "15 nov · Netflix · $219.00" y "15 mar 2027 · Seguro anual · $500.00", que suman los $719.00 del método

#### Scenario: Física y digital juntas
- **WHEN** en noviembre 2026 hay $219.00 con "BBVA Azul" digital y $238.50 con "BBVA Azul" física y el usuario toca "BBVA Azul"
- **THEN** el detalle muestra los dos gastos en la misma lista, sin indicar la variante, y suman $457.50

#### Scenario: Cambiar de método
- **WHEN** el detalle de "BBVA Azul" está abierto y el usuario toca "Nu Débito"
- **THEN** se cierra el detalle de BBVA Azul y se abre el de Nu Débito

#### Scenario: Cerrar el detalle de un método
- **WHEN** el detalle de "BBVA Azul" está abierto y el usuario toca otra vez "BBVA Azul"
- **THEN** el detalle se cierra

#### Scenario: Independiente de la categoría
- **WHEN** el detalle de "Transporte" está abierto en "Por categoría" y el usuario toca "BBVA Azul" en "Por método"
- **THEN** los dos detalles quedan abiertos

#### Scenario: Detalle de método de solo lectura
- **WHEN** el usuario toca la fila "Netflix" del detalle de BBVA Azul
- **THEN** no se abre la edición ni cambia la pantalla

### Requirement: Detalle de método al cambiar de mes
Al cambiar de mes, el detalle SHALL seguir abierto si el método activo tiene gastos en el mes nuevo, mostrando los de ese mes; si no, la selección y el detalle SHALL cerrarse.

#### Scenario: El método existe en el mes nuevo
- **WHEN** el detalle de "Nu Débito" está abierto en noviembre 2026 y en diciembre 2026 Nu Débito tiene gastos
- **THEN** en diciembre el detalle de Nu Débito sigue abierto con los gastos de diciembre

#### Scenario: El método no existe en el mes nuevo
- **WHEN** el detalle de "Efectivo" está abierto en noviembre 2026 y en diciembre 2026 no hay gastos con Efectivo
- **THEN** en diciembre no hay ningún método abierto, y al volver a noviembre Efectivo sigue cerrado
