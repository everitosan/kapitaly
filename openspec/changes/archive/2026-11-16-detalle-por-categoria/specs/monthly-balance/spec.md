## ADDED Requirements

### Requirement: Aclaración de Por categoría
Debajo del título "Por categoría", cuando hay gastos para analizar, SHALL mostrarse el texto "Incluye la parte proporcional de lo que pagas cada cierto tiempo, como un seguro anual. Así ves cuánto te cuesta tu estilo de vida."

#### Scenario: Texto de la tarjeta
- **WHEN** el usuario abre "Análisis" de un mes con gastos
- **THEN** la tarjeta "Por categoría" muestra "Incluye la parte proporcional de lo que pagas cada cierto tiempo, como un seguro anual. Así ves cuánto te cuesta tu estilo de vida."

#### Scenario: Mes sin gastos
- **WHEN** el mes no tiene gastos vigentes ni únicos
- **THEN** la tarjeta solo indica que no hay gastos para analizar

### Requirement: Detalle de la categoría activa
Al activar una categoría en "Por categoría", SHALL abrirse justo debajo de su fila en la leyenda una lista de solo lectura con fecha, concepto y monto de cada gasto que forma su cifra: recurrentes vigentes de esa categoría con su costo mensual y únicos del mes. La suma SHALL ser igual al monto de la leyenda. Solo SHALL haber un detalle abierto; tocar la categoría activa SHALL cerrarlo.

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

### Requirement: Fechas y orden del detalle de categoría
En el detalle, un gasto mensual SHALL mostrar la fecha de su cobro en el mes, uno de intervalo mayor a un mes la de su próximo cobro (la misma de la lista de Prorrateados) y un único su fecha. La lista SHALL ordenarse por fecha, de la más antigua a la más reciente; en la misma fecha, por nombre. Una fecha de otro año que el mes consultado SHALL mostrar el año. Un gasto sin fecha SHALL mostrar un guion e ir al final.

#### Scenario: Orden por fecha
- **WHEN** en noviembre 2026 "Hogar" tiene Renta mensual (día 20) y el gasto único "Focos" (03/11/2026)
- **THEN** el detalle muestra primero "3 nov · Focos" y después "20 nov · Renta"

#### Scenario: Próximo cobro de otro año
- **WHEN** hoy es 11/11/2026 y el Seguro anual tiene fecha de cobro 15/03/2026
- **THEN** su fila del detalle muestra "15 mar 2027"

#### Scenario: Mensual sin cobro en el mes
- **WHEN** un gasto mensual con día 15 tiene fecha de fin 10/11/2026 y se consulta noviembre 2026
- **THEN** su fila muestra un guion en la fecha y va al final del detalle

#### Scenario: Sin cobros próximos
- **WHEN** un gasto semestral de la categoría ya no tiene cobros a partir de la fecha de referencia
- **THEN** su fila muestra un guion en la fecha y va al final del detalle

### Requirement: Detalle de categoría al cambiar de mes
Al cambiar de mes, el detalle SHALL seguir abierto si la categoría activa tiene gastos en el mes nuevo, mostrando los de ese mes; si no, la selección y el detalle SHALL cerrarse.

#### Scenario: La categoría existe en el mes nuevo
- **WHEN** el detalle de "Hogar" está abierto en noviembre 2026 y el usuario avanza a diciembre 2026, donde Hogar tiene gastos
- **THEN** el detalle de Hogar sigue abierto con los gastos de diciembre

#### Scenario: La categoría no existe en el mes nuevo
- **WHEN** el detalle de "Transporte" está abierto en noviembre 2026 y en diciembre 2026 no hay gastos de Transporte
- **THEN** en diciembre ninguna categoría aparece activa y no hay detalle abierto
