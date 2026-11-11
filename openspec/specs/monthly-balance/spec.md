# monthly-balance Specification

## Purpose

Muestra cuánto suman los gastos de un mes, recurrentes y únicos, desde dos ángulos: lo que realmente sale en ese mes, con su desglose por método de pago, y el costo mensual promedio, con pistas de cuándo caen los cobros no mensuales.

## Requirements

### Requirement: Calcular las fechas de cobro de un gasto
El sistema SHALL calcular las fechas de cobro de un gasto a partir de su fecha de cobro (ancla), sumando múltiplos de su intervalo en meses (Anual = 12 meses), conservando el día del ancla. Solo SHALL considerar fechas entre la fecha ancla y la fecha de fin, ambas inclusive, si existe.

#### Scenario: Cobros de un gasto bimestral
- **WHEN** un gasto bimestral tiene fecha de cobro 28/09/2026
- **THEN** sus cobros caen el 28/09/2026, 28/11/2026, 28/01/2027 y así sucesivamente, y no hay cobro en octubre ni en diciembre de 2026

#### Scenario: Sin cobros antes del ancla
- **WHEN** un gasto mensual tiene fecha de cobro 10/12/2026
- **THEN** el balance de noviembre 2026 no incluye ningún cobro de ese gasto

### Requirement: Ajustar cobros a meses más cortos
Cuando el día de la fecha ancla no exista en un mes, el sistema SHALL ubicar el cobro de ese mes en el último día del mes, y en los meses siguientes SHALL volver a usar el día original del ancla.

#### Scenario: Día 31 en mes de 30 días
- **WHEN** un gasto mensual tiene fecha de cobro 31/10/2026
- **THEN** su cobro de noviembre 2026 cae el 30/11/2026 y el de diciembre 2026 el 31/12/2026

#### Scenario: Febrero
- **WHEN** un gasto mensual tiene fecha de cobro 30/01/2027
- **THEN** su cobro de febrero 2027 cae el 28/02/2027 y el de marzo 2027 el 30/03/2027

#### Scenario: Anual en 29 de febrero
- **WHEN** un gasto anual tiene fecha de cobro 29/02/2028
- **THEN** su cobro de 2029 cae el 28/02/2029 y el de 2032 el 29/02/2032

### Requirement: Navegar entre meses
La pantalla de balance SHALL abrir mostrando el mes en curso y SHALL permitir avanzar y retroceder mes por mes, mostrando el nombre del mes y el año seleccionados. Al cambiar de mes SHALL conservar la vista seleccionada.

#### Scenario: Apertura en el mes actual
- **WHEN** el usuario abre la app el 11/11/2026
- **THEN** el balance muestra noviembre 2026

#### Scenario: Cambio de mes conservando la vista
- **WHEN** el usuario está en la vista Promedio de noviembre 2026 y avanza al mes siguiente
- **THEN** se muestra la vista Promedio de diciembre 2026

### Requirement: Alternar entre las vistas Este mes y Promedio
La pantalla de balance SHALL ofrecer un control de dos opciones, "Este mes" y "Promedio", que cambia la vista sin salir de la pantalla. La vista inicial SHALL ser "Este mes".

#### Scenario: Cambio de vista
- **WHEN** el usuario está en "Este mes" y selecciona "Promedio"
- **THEN** la pantalla muestra la vista Promedio del mismo mes

### Requirement: Vista Este mes
La vista "Este mes" SHALL mostrar los cobros de gastos recurrentes que caen en el mes seleccionado y los gastos únicos con fecha en ese mes. Incluye el número de cargos, el total exacto, los subtotales de recurrentes y de únicos, y una lista ordenada por fecha (y por nombre si empatan). Cada elemento muestra fecha, nombre o descripción, monto real, método de pago y una marca si es único. Los gastos eliminados no SHALL incluirse.

#### Scenario: Total y conteo del mes
- **WHEN** en noviembre 2026 caen Netflix ($219.00, día 15), Renta ($1,500.00, día 20) e Internet bimestral ($450.00, día 28), hay un gasto único "Recarga metro" ($100.00, día 8) y existe un seguro anual de $6,000.00 que se cobra en marzo
- **THEN** la vista muestra 4 cargos, un total de $2,269.00, subtotales de $2,169.00 en recurrentes y $100.00 en únicos, y la lista Recarga metro, Netflix, Renta, Internet en ese orden, sin el seguro

#### Scenario: Mes sin cargos
- **WHEN** en el mes seleccionado no cae ningún cobro ni hay gastos únicos
- **THEN** la vista muestra 0 cargos, un total de $0.00 y un mensaje indicando que no hay cargos ese mes

### Requirement: Marca de cobros por confirmar
En la vista "Este mes", cada cobro recurrente que esté por confirmar SHALL mostrar la marca "Por confirmar". Las cifras de "Este mes" y "Promedio" SHALL seguir calculándose con el monto de la regla, confirmados o no.

#### Scenario: Marca en un cobro vencido
- **WHEN** hoy es 16/11/2026 y el cobro de Netflix del 15/11/2026 no se ha confirmado
- **THEN** la fila de Netflix en "Este mes" muestra "Por confirmar"

#### Scenario: Sin marca tras confirmar
- **WHEN** el usuario confirma el cobro de Netflix del 15/11/2026
- **THEN** la fila de Netflix deja de mostrar "Por confirmar"

### Requirement: Desglose por método de pago
La vista "Este mes" SHALL mostrar cuánto sale por cada método de pago en el mes seleccionado, sumando cargos recurrentes y gastos únicos, ordenado de mayor a menor monto. Solo SHALL listar los métodos con monto mayor a cero, incluidos los archivados. La suma del desglose SHALL ser igual al total del mes.

#### Scenario: Desglose del mes
- **WHEN** en noviembre 2026 Netflix ($219.00) se paga con "BBVA Azul", Renta ($1,500.00) e Internet ($450.00) con "Nu Débito" y "Recarga metro" ($100.00) con "Efectivo"
- **THEN** el desglose muestra Nu Débito $1,950.00, BBVA Azul $219.00 y Efectivo $100.00, en ese orden, que suman $2,269.00

#### Scenario: El desglose suma física y digital
- **WHEN** en noviembre 2026 hay $219.00 con "BBVA Azul" digital y $238.50 con "BBVA Azul" física
- **THEN** el desglose muestra una sola línea "BBVA Azul" con $457.50

#### Scenario: Método archivado con cargos
- **WHEN** un método archivado sigue asignado a un gasto recurrente que cae en el mes
- **THEN** el desglose incluye ese método con su monto

### Requirement: Vista Promedio
La vista "Promedio" SHALL listar cada gasto recurrente vigente en el mes con su costo mensual proporcional (monto entre los meses del intervalo, redondeado al centavo) y cada gasto único del mes con su monto real. Su total es la suma de los montos mostrados, con subtotales de fijos mensuales, prorrateados y únicos. Un recurrente es vigente si su ancla es anterior o igual al último día del mes y su fecha de fin, si la tiene, es posterior o igual al primer día.

#### Scenario: Proporcionales y total
- **WHEN** están vigentes Netflix mensual ($219.00), Renta mensual ($1,500.00), Internet bimestral ($450.00) y Seguro anual ($6,000.00), y en el mes hay un gasto único "Recarga metro" de $100.00
- **THEN** la vista muestra $219.00, $1,500.00, $225.00, $500.00 y $100.00 respectivamente, con un total de $2,544.00 y subtotales de $1,719.00 fijos, $725.00 prorrateados y $100.00 únicos

#### Scenario: Redondeo al centavo
- **WHEN** está vigente un gasto trimestral de $1,000.00
- **THEN** su costo mensual proporcional se muestra como $333.33 y el total suma $333.33 por ese gasto

#### Scenario: Gasto aún no vigente
- **WHEN** un gasto mensual tiene fecha de cobro 10/12/2026 y se consulta noviembre 2026
- **THEN** ese gasto no aparece en la vista Promedio de noviembre 2026

#### Scenario: Gastos únicos de otro mes
- **WHEN** existe un gasto único con fecha 30/10/2026 y se consulta noviembre 2026
- **THEN** ese gasto no aparece en la vista Promedio de noviembre 2026

### Requirement: Pista del cobro real en la vista Promedio
Para cada gasto con intervalo mayor a un mes, la vista Promedio SHALL mostrar su monto real, su frecuencia y la fecha de su próximo cobro, que es el primero que cae en o después de la fecha de referencia. La fecha de referencia es la fecha de hoy o el primer día del mes seleccionado, la que sea posterior. Si no quedan cobros, SHALL indicar que no hay cobros próximos.

#### Scenario: Pista de un gasto anual
- **WHEN** hoy es 11/11/2026, se consulta noviembre 2026 y existe un seguro anual de $6,000.00 con fecha de cobro 15/03/2026
- **THEN** la vista muestra junto al seguro "$6,000.00 · Anual · próximo cobro 15/03/2027"

#### Scenario: Referencia en un mes futuro
- **WHEN** hoy es 11/11/2026, se consulta enero 2027 y existe un gasto bimestral con fecha de cobro 28/09/2026
- **THEN** la pista indica como próximo cobro el 28/01/2027

#### Scenario: Gasto mensual sin pista
- **WHEN** un gasto es mensual
- **THEN** la vista Promedio muestra solo su monto mensual, sin pista de próximo cobro

#### Scenario: Sin cobros próximos
- **WHEN** un gasto semestral con fecha de cobro 01/01/2026 y fecha de fin 30/06/2026 se consulta en junio 2026 y hoy es 11/11/2026
- **THEN** la pista indica que no hay cobros próximos
