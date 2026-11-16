## MODIFIED Requirements

### Requirement: Detalle de la categoría activa
Al activar una categoría en "Por categoría", SHALL abrirse justo debajo de su fila en la leyenda una lista de solo lectura con fecha, concepto y monto de cada gasto que forma su cifra: recurrentes vigentes de esa categoría con su costo mensual y únicos del mes. La suma SHALL ser igual al monto de la leyenda. Solo SHALL haber un detalle abierto; tocar la categoría activa SHALL cerrarlo. Si Kapitaly completo está bloqueado y no hay prueba vigente (ver `premium-unlock`), en lugar de la lista SHALL abrirse en el mismo lugar el aviso de candado; la categoría SHALL resaltarse igual.

#### Scenario: Abrir el detalle
- **WHEN** hoy es 11/11/2026, en noviembre 2026 "Transporte" tiene el gasto único "Recarga metro" ($100.00, 08/11/2026) y el Seguro anual ($6,000.00, fecha de cobro 15/03/2026), y el usuario toca "Transporte" en la leyenda
- **THEN** debajo de la fila de Transporte aparece "8 nov · Recarga metro · $100.00" y "15 mar 2027 · Seguro anual · $500.00", que suman los $600.00 de la leyenda

#### Scenario: Activar desde la dona
- **WHEN** el usuario toca el segmento de "Hogar" en la dona
- **THEN** la dona resalta Hogar y el detalle se abre debajo de la fila de Hogar en la leyenda

#### Scenario: Cambiar de categoría
- **WHEN** el detalle de "Transporte" está abierto y el usuario toca "Hogar"
- **THEN** se cierra el detalle de Transporte y se abre el de Hogar

#### Scenario: Cerrar el detalle
- **WHEN** el detalle de "Transporte" está abierto y el usuario toca otra vez "Transporte"
- **THEN** el detalle se cierra y la dona deja de resaltar la categoría

#### Scenario: Solo lectura
- **WHEN** el usuario toca la fila "Seguro anual" del detalle
- **THEN** no se abre la edición ni cambia la pantalla

#### Scenario: Detalle de categoría con candado
- **WHEN** el candado está encendido, el usuario no tiene Kapitaly completo y toca "Transporte" en la leyenda
- **THEN** Transporte se resalta y debajo de su fila aparece el aviso de candado en lugar de sus gastos

### Requirement: Detalle del método activo
Cada fila de "Por método" SHALL poder tocarse. Al tocarla SHALL abrirse debajo de ella una lista de solo lectura con fecha, concepto y monto de cada gasto que forma su cifra, con las mismas filas, fechas y orden que "Fechas y orden del detalle de categoría"; su suma SHALL ser igual al monto del método. Solo SHALL haber un método abierto; tocarlo otra vez SHALL cerrarlo. Si Kapitaly completo está bloqueado y no hay prueba vigente (ver `premium-unlock`), en lugar de la lista SHALL abrirse en el mismo lugar el aviso de candado.

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

#### Scenario: Detalle de método con candado
- **WHEN** el candado está encendido, el usuario no tiene Kapitaly completo y toca "BBVA Azul" en "Por método"
- **THEN** debajo de BBVA Azul aparece el aviso de candado en lugar de sus gastos
