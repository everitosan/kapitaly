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
- **WHEN** el usuario está en la vista Análisis de noviembre 2026 y avanza al mes siguiente
- **THEN** se muestra la vista Análisis de diciembre 2026

### Requirement: Alternar entre las vistas Este mes y Análisis
La pantalla de balance SHALL ofrecer un control de dos opciones, "Este mes" y "Análisis", que cambia la vista sin salir de la pantalla. La vista inicial SHALL ser "Este mes".

#### Scenario: Cambio de vista
- **WHEN** el usuario está en "Este mes" y selecciona "Análisis"
- **THEN** la pantalla muestra la vista Análisis del mismo mes

### Requirement: Vista Este mes
La vista "Este mes" SHALL mostrar una tarjeta con lo efectuado y lo proyectado del mes y, debajo, la lista de cargos: los cobros de gastos recurrentes que caen en el mes seleccionado y los gastos únicos con fecha en ese mes. Cada elemento muestra fecha, nombre o descripción, monto, método de pago, el ícono y nombre de su categoría y una marca si es único. Los gastos eliminados no SHALL incluirse. La vista no SHALL mostrar el desglose por método de pago.

#### Scenario: Total y conteo del mes
- **WHEN** hoy es 11/11/2026 y en noviembre 2026 caen Netflix ($219.00, día 15), Renta ($1,500.00, día 20) e Internet bimestral ($450.00, día 28), hay un gasto único "Recarga metro" ($100.00, día 8) y existe un seguro anual de $6,000.00 que se cobra en marzo
- **THEN** la lista muestra 4 cargos, Recarga metro, Netflix, Renta e Internet en ese orden, sin el seguro, y la tarjeta muestra $100.00 de $2,269.00 proyectados

#### Scenario: Mes sin cargos
- **WHEN** en el mes seleccionado no cae ningún cobro ni hay gastos únicos
- **THEN** la tarjeta muestra $0.00 efectuado de $0.00 proyectados y la lista indica que no hay cargos ese mes

#### Scenario: Categoría en la fila
- **WHEN** Netflix tiene la categoría "Suscripciones" y se cobra en noviembre 2026
- **THEN** su fila en "Este mes" muestra el ícono y el nombre "Suscripciones"

#### Scenario: Categoría borrada
- **WHEN** "Smart Fit" tenía la categoría personalizada "Gimnasio" y esta se borró
- **THEN** su fila muestra "Otro"

#### Scenario: Sin desglose por método
- **WHEN** el usuario abre "Este mes"
- **THEN** no aparece la tarjeta "Por método"

### Requirement: Marca de cobros por confirmar
En la vista "Este mes", cada cobro recurrente que esté por confirmar SHALL mostrar la marca "Por confirmar". Las cifras de "Este mes" SHALL usar el monto confirmado según se define en "Efectuado y proyectado del mes"; las de "Análisis" SHALL seguir calculándose con el monto de la regla, confirmados o no.

#### Scenario: Marca en un cobro vencido
- **WHEN** hoy es 16/11/2026 y el cobro de Netflix del 15/11/2026 no se ha confirmado
- **THEN** la fila de Netflix en "Este mes" muestra "Por confirmar"

#### Scenario: Sin marca tras confirmar
- **WHEN** el usuario confirma el cobro de Netflix del 15/11/2026
- **THEN** la fila de Netflix deja de mostrar "Por confirmar"

#### Scenario: Análisis ignora el monto confirmado
- **WHEN** Netflix ($219.00 mensual) se confirmó como cobrado con $239.00 en noviembre 2026
- **THEN** el costo mensual promedio de noviembre cuenta $219.00 por Netflix

### Requirement: Costo mensual por método de pago
La vista "Análisis" SHALL mostrar el costo mensual promedio repartido por método de pago, con los mismos montos que el costo mensual promedio (proporcionales de recurrentes y únicos del mes), ordenado de mayor a menor. Solo SHALL listar métodos con monto mayor a cero, incluidos los archivados, y su suma SHALL ser igual al costo mensual promedio. SHALL indicar que es un estimado con prorrateo y no lo cobrado.

#### Scenario: Desglose del mes
- **WHEN** en noviembre 2026 Netflix ($219.00 mensual) y el Seguro anual ($6,000.00) se pagan con "BBVA Azul", Renta ($1,500.00 mensual) e Internet bimestral ($450.00) con "Nu Débito" y "Recarga metro" ($100.00) con "Efectivo"
- **THEN** el desglose muestra Nu Débito $1,725.00, BBVA Azul $719.00 y Efectivo $100.00, en ese orden, que suman $2,544.00

#### Scenario: Aclaración visible
- **WHEN** el usuario ve "Por método" en Análisis
- **THEN** la sección indica que es un estimado con prorrateo y que lo cobrado está en "Este mes"

#### Scenario: El desglose suma física y digital
- **WHEN** en noviembre 2026 hay $219.00 con "BBVA Azul" digital y $238.50 con "BBVA Azul" física
- **THEN** el desglose muestra una sola línea "BBVA Azul" con $457.50

#### Scenario: Método archivado con cargos
- **WHEN** un método archivado sigue asignado a un gasto recurrente vigente en el mes
- **THEN** el desglose incluye ese método con su monto

### Requirement: Costo mensual promedio en Análisis
La vista "Análisis" SHALL mostrar el costo mensual promedio: la suma del costo mensual proporcional de cada gasto recurrente vigente en el mes (monto entre los meses del intervalo, redondeado al centavo) y del monto real de cada gasto único del mes, con subtotales de fijos mensuales, prorrateados y únicos. Un recurrente es vigente si su ancla es anterior o igual al último día del mes y su fecha de fin, si la tiene, es posterior o igual al primer día.

#### Scenario: Proporcionales y total
- **WHEN** están vigentes Netflix mensual ($219.00), Renta mensual ($1,500.00), Internet bimestral ($450.00) y Seguro anual ($6,000.00), y en el mes hay un gasto único "Recarga metro" de $100.00
- **THEN** el costo mensual promedio es $2,544.00, con subtotales de $1,719.00 fijos, $725.00 prorrateados y $100.00 únicos

#### Scenario: Redondeo al centavo
- **WHEN** está vigente un gasto trimestral de $1,000.00
- **THEN** su costo mensual proporcional es $333.33 y el total suma $333.33 por ese gasto

#### Scenario: Gasto aún no vigente
- **WHEN** un gasto mensual tiene fecha de cobro 10/12/2026 y se consulta noviembre 2026
- **THEN** ese gasto no cuenta en el costo mensual promedio de noviembre 2026

#### Scenario: Gastos únicos de otro mes
- **WHEN** existe un gasto único con fecha 30/10/2026 y se consulta noviembre 2026
- **THEN** ese gasto no cuenta en el costo mensual promedio de noviembre 2026

### Requirement: Sin lista suelta en Análisis
La vista "Análisis" no SHALL listar los gastos fuera de las listas de Fijos, Prorrateados y Únicos.

#### Scenario: Sin lista suelta de gastos
- **WHEN** el usuario abre "Análisis"
- **THEN** no aparecen las secciones "Proporcional por gasto" ni "Únicos del mes"

### Requirement: Categoría en las listas de Análisis
Cada gasto de las listas de Fijos, Prorrateados y Únicos SHALL mostrar el ícono y el nombre de su categoría; un gasto de una categoría borrada SHALL mostrarse con "Otro".

#### Scenario: Categoría en la vista Promedio
- **WHEN** Renta tiene la categoría "Hogar"
- **THEN** su fila en la lista de Fijos muestra el ícono y el nombre "Hogar"

### Requirement: Pista del cobro real en Prorrateados
Para cada gasto con intervalo mayor a un mes, la lista de Prorrateados SHALL mostrar su monto real, su frecuencia y la fecha de su próximo cobro, que es el primero que cae en o después de la fecha de referencia. La fecha de referencia es la fecha de hoy o el primer día del mes seleccionado, la que sea posterior. Si no quedan cobros, SHALL indicar que no hay cobros próximos.

#### Scenario: Pista de un gasto anual
- **WHEN** hoy es 11/11/2026, se consulta noviembre 2026 y existe un seguro anual de $6,000.00 con fecha de cobro 15/03/2026
- **THEN** la lista de Prorrateados muestra junto al seguro "$6,000.00 · Anual · próximo cobro 15/03/2027"

#### Scenario: Referencia en un mes futuro
- **WHEN** hoy es 11/11/2026, se consulta enero 2027 y existe un gasto bimestral con fecha de cobro 28/09/2026
- **THEN** la pista indica como próximo cobro el 28/01/2027

#### Scenario: Gasto mensual sin pista
- **WHEN** un gasto es mensual
- **THEN** aparece en la lista de Fijos con su monto mensual, sin pista de próximo cobro

#### Scenario: Sin cobros próximos
- **WHEN** un gasto semestral con fecha de cobro 01/01/2026 y fecha de fin 30/06/2026 se consulta en junio 2026 y hoy es 11/11/2026
- **THEN** la pista indica que no hay cobros próximos

### Requirement: Efectuado y proyectado del mes
La tarjeta de "Este mes" SHALL mostrar lo efectuado y "de <proyectado> proyectados". Efectuado suma los únicos del mes y los cobros recurrentes cobrados: confirmados como cobrados, con el monto confirmado, o anteriores al día en que se registró el gasto, con el monto de la regla. Proyectado suma lo efectuado y los cobros por confirmar o futuros con el monto de la regla; los marcados como no cobrados no cuentan.

#### Scenario: Efectuado y proyectado
- **WHEN** hoy es 21/11/2026, en noviembre hay "Recarga metro" ($100.00, día 8), Netflix ($219.00, día 15) confirmado como cobrado con $239.00, Renta ($1,500.00, día 20) sin confirmar e Internet ($450.00, día 28)
- **THEN** la tarjeta muestra $339.00 de $2,289.00 proyectados

#### Scenario: Cobro no realizado
- **WHEN** en el mismo caso Renta se marca como no cobrada
- **THEN** la tarjeta muestra $339.00 de $789.00 proyectados

#### Scenario: Cobro anterior al registro
- **WHEN** un gasto mensual de $500.00 con fecha de cobro 01/11/2026 se registró el 10/11/2026
- **THEN** su cobro del 01/11/2026 cuenta $500.00 en lo efectuado de noviembre

#### Scenario: Mes futuro
- **WHEN** hoy es 21/11/2026 y se consulta diciembre 2026, sin gastos únicos ese mes
- **THEN** la tarjeta muestra $0.00 efectuado y el proyectado suma todos los cobros de diciembre

### Requirement: Barra de avance del mes
La tarjeta de "Este mes" SHALL mostrar una barra que reparte lo proyectado en tres partes: lo efectuado, lo por confirmar y lo que falta por cobrar, con los montos de las dos últimas.

#### Scenario: Partes de la barra
- **WHEN** lo efectuado es $339.00, Renta ($1,500.00) está por confirmar e Internet ($450.00) aún no llega
- **THEN** la barra muestra $1,500.00 por confirmar y $450.00 por cobrar

### Requirement: Atajos de Este mes a Análisis
La tarjeta de "Este mes" SHALL tener los botones "Por categoría" y "Por método". Cada uno SHALL cambiar a la vista "Análisis" del mismo mes y desplazarla hasta esa sección.

#### Scenario: Ir a Por categoría
- **WHEN** el usuario toca "Por categoría" en "Este mes" de noviembre 2026
- **THEN** se muestra "Análisis" de noviembre 2026 con la sección "Por categoría" a la vista

#### Scenario: Ir a Por método
- **WHEN** el usuario toca "Por método" en "Este mes"
- **THEN** se muestra "Análisis" con la sección "Por método" a la vista

### Requirement: Buscar en la lista de Este mes
Arriba de la lista de "Este mes" SHALL haber un buscador que filtra los cargos cuyo nombre o descripción, categoría o método de pago contenga el texto, sin distinguir mayúsculas ni acentos. Con texto SHALL indicar cuántos cargos coinciden y, si ninguno, un mensaje. La búsqueda no SHALL cambiar las cifras de la tarjeta.

#### Scenario: Filtrar por nombre
- **WHEN** el usuario escribe "netf" en el buscador
- **THEN** la lista muestra solo Netflix y la tarjeta conserva sus cifras

#### Scenario: Filtrar por categoría sin acentos
- **WHEN** Renta tiene la categoría "Hogar" y el usuario escribe "HOGAR"
- **THEN** la lista muestra Renta

#### Scenario: Sin coincidencias
- **WHEN** el usuario escribe un texto que ningún cargo contiene
- **THEN** la lista muestra un mensaje de que nada coincide

#### Scenario: Borrar la búsqueda
- **WHEN** el usuario borra el texto del buscador
- **THEN** la lista vuelve a mostrar todos los cargos del mes

### Requirement: Orden de la lista de Este mes
La lista de "Este mes" SHALL ordenarse por fecha de cobro de la más antigua a la más reciente; en la misma fecha, por la hora en que se registró el gasto y luego por nombre. Un botón SHALL invertir el orden y mostrar el orden vigente.

#### Scenario: Mismo día
- **WHEN** el 11/11/2026 hay dos gastos únicos, "Tacos" registrado a las 14:20 y "Súper" registrado a las 18:47
- **THEN** "Tacos" aparece antes que "Súper"

#### Scenario: Invertir el orden
- **WHEN** el usuario toca el botón de orden
- **THEN** la lista muestra primero el cargo más reciente y el botón indica "Más reciente"

### Requirement: Estado de cada cobro en la lista
En la lista de "Este mes", un cobro recurrente cuya fecha es posterior a hoy y no tiene confirmación SHALL verse tenue con la marca "Por cobrar". Un cobro marcado como no cobrado SHALL verse tenue, sin color y tachado, con la marca "No se cobró". Un cobro confirmado con otro monto SHALL mostrar el monto confirmado y el esperado.

#### Scenario: Cobro futuro
- **WHEN** hoy es 21/11/2026 e Internet se cobra el 28/11/2026
- **THEN** la fila de Internet se ve tenue con "Por cobrar"

#### Scenario: Cobro no realizado en la lista
- **WHEN** Renta del 20/11/2026 se marcó como no cobrada
- **THEN** la fila de Renta sigue en la lista, tenue, sin color y tachada, con "No se cobró"

#### Scenario: Monto distinto al esperado
- **WHEN** Netflix ($219.00) se confirmó como cobrado con $239.00
- **THEN** su fila muestra $239.00 y "esperado $219.00"

### Requirement: Aclaración del costo mensual promedio
Junto al título "Costo mensual promedio" SHALL haber un botón de información que muestra una explicación: es el costo de vida mensual (fijos, la parte mensual de lo que se paga cada varios meses y los únicos del mes), no lo cobrado este mes, que está en "Este mes".

#### Scenario: Ver la aclaración
- **WHEN** el usuario toca el botón de información del costo mensual promedio
- **THEN** aparece la explicación y se cierra al tocar "Entendido"

### Requirement: Listas de Fijos, Prorrateados y Únicos
Los subtotales Fijos, Prorrateados y Únicos de Análisis SHALL poder tocarse. Cada uno SHALL abrir un modal con su total, un buscador arriba y la lista de sus gastos: recurrentes mensuales vigentes, recurrentes vigentes de intervalo mayor a un mes con su costo mensual, o únicos del mes. El buscador SHALL filtrar por nombre, categoría o método, sin distinguir mayúsculas ni acentos.

#### Scenario: Abrir Prorrateados
- **WHEN** están vigentes Internet bimestral ($450.00) y Seguro anual ($6,000.00) y el usuario toca "Prorrateados"
- **THEN** se abre un modal con $725.00 al mes, Internet con $225.00 al mes y el Seguro con $500.00 al mes

#### Scenario: Buscar en Fijos
- **WHEN** el modal de Fijos muestra Netflix y Renta y el usuario escribe "renta"
- **THEN** la lista del modal muestra solo Renta

#### Scenario: Tocar un gasto del modal
- **WHEN** el usuario toca Renta en el modal de Fijos
- **THEN** se abre la edición de Renta

### Requirement: Costo mensual por categoría
La vista "Análisis" SHALL mostrar una gráfica de dona con el costo mensual promedio repartido por categoría (proporcionales de recurrentes y únicos del mes) y una leyenda con monto y porcentaje, de mayor a menor. Su suma SHALL ser igual al costo mensual promedio. Tocar una categoría SHALL resaltarla y mostrar su monto y porcentaje en el centro.

#### Scenario: Reparto por categoría
- **WHEN** Renta ($1,500.00 mensual) es "Hogar", el Seguro anual ($6,000.00) y "Recarga metro" ($100.00) son "Transporte", Internet bimestral ($450.00) es "Servicios" y Netflix ($219.00 mensual) es "Suscripciones"
- **THEN** la leyenda muestra Hogar $1,500.00 (59%), Transporte $600.00 (24%), Servicios $225.00 (9%) y Suscripciones $219.00 (9%)

#### Scenario: Resaltar una categoría
- **WHEN** el usuario toca "Transporte" en la leyenda
- **THEN** la gráfica resalta Transporte y el centro muestra $600.00 y 24%

#### Scenario: Sin gastos
- **WHEN** el mes no tiene gastos vigentes ni únicos
- **THEN** la sección indica que no hay gastos para analizar
