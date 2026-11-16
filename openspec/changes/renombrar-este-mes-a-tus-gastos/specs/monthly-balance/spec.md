## RENAMED Requirements

- FROM: `### Requirement: Alternar entre las vistas Este mes y Análisis`
- TO: `### Requirement: Alternar entre las vistas Tus gastos y Análisis`

- FROM: `### Requirement: Vista Este mes`
- TO: `### Requirement: Vista Tus gastos`

- FROM: `### Requirement: Atajos de Este mes a Análisis`
- TO: `### Requirement: Atajos de Tus gastos a Análisis`

- FROM: `### Requirement: Buscar en la lista de Este mes`
- TO: `### Requirement: Buscar en la lista de Tus gastos`

- FROM: `### Requirement: Orden de la lista de Este mes`
- TO: `### Requirement: Orden de la lista de Tus gastos`

## MODIFIED Requirements

### Requirement: Alternar entre las vistas Tus gastos y Análisis
La pantalla de balance SHALL ofrecer un control de dos opciones, "Tus gastos" y "Análisis", que cambia la vista sin salir de la pantalla. La vista inicial SHALL ser "Tus gastos".

#### Scenario: Cambio de vista
- **WHEN** el usuario está en "Tus gastos" y selecciona "Análisis"
- **THEN** la pantalla muestra la vista Análisis del mismo mes

#### Scenario: Nombre de la vista en otro mes
- **WHEN** el usuario retrocede de noviembre 2026 a octubre 2026
- **THEN** el control sigue mostrando las opciones "Tus gastos" y "Análisis"

### Requirement: Vista Tus gastos
La vista "Tus gastos" SHALL mostrar una tarjeta con lo efectuado y lo proyectado del mes y, debajo, la lista de cargos: los cobros de gastos recurrentes que caen en el mes seleccionado y los gastos únicos con fecha en ese mes. Cada elemento muestra fecha, nombre o descripción, monto, método de pago, el ícono y nombre de su categoría y una marca si es único. Los gastos eliminados no SHALL incluirse. La vista no SHALL mostrar el desglose por método de pago.

#### Scenario: Total y conteo del mes
- **WHEN** hoy es 11/11/2026 y en noviembre 2026 caen Netflix ($219.00, día 15), Renta ($1,500.00, día 20) e Internet bimestral ($450.00, día 28), hay un gasto único "Recarga metro" ($100.00, día 8) y existe un seguro anual de $6,000.00 que se cobra en marzo
- **THEN** la lista muestra 4 cargos, Recarga metro, Netflix, Renta e Internet en ese orden, sin el seguro, y la tarjeta muestra $100.00 de $2,269.00 proyectados

#### Scenario: Mes sin cargos
- **WHEN** en el mes seleccionado no cae ningún cobro ni hay gastos únicos
- **THEN** la tarjeta muestra $0.00 efectuado de $0.00 proyectados y la lista indica que no hay cargos ese mes

#### Scenario: Categoría en la fila
- **WHEN** Netflix tiene la categoría "Suscripciones" y se cobra en noviembre 2026
- **THEN** su fila en "Tus gastos" muestra el ícono y el nombre "Suscripciones"

#### Scenario: Categoría borrada
- **WHEN** "Smart Fit" tenía la categoría personalizada "Gimnasio" y esta se borró
- **THEN** su fila muestra "Otro"

#### Scenario: Sin desglose por método
- **WHEN** el usuario abre "Tus gastos"
- **THEN** no aparece la tarjeta "Por método"

### Requirement: Marca de cobros por confirmar
En la vista "Tus gastos", cada cobro recurrente que esté por confirmar SHALL mostrar la marca "Por confirmar". Las cifras de "Tus gastos" SHALL usar el monto confirmado según se define en "Efectuado y proyectado del mes"; las de "Análisis" SHALL seguir calculándose con el monto de la regla, confirmados o no.

#### Scenario: Marca en un cobro vencido
- **WHEN** hoy es 16/11/2026 y el cobro de Netflix del 15/11/2026 no se ha confirmado
- **THEN** la fila de Netflix en "Tus gastos" muestra "Por confirmar"

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
- **THEN** la sección indica que es un estimado con prorrateo y que lo cobrado está en "Tus gastos"

#### Scenario: El desglose suma física y digital
- **WHEN** en noviembre 2026 hay $219.00 con "BBVA Azul" digital y $238.50 con "BBVA Azul" física
- **THEN** el desglose muestra una sola línea "BBVA Azul" con $457.50

#### Scenario: Método archivado con cargos
- **WHEN** un método archivado sigue asignado a un gasto recurrente vigente en el mes
- **THEN** el desglose incluye ese método con su monto

### Requirement: Efectuado y proyectado del mes
La tarjeta de "Tus gastos" SHALL mostrar lo efectuado y "de <proyectado> proyectados". Efectuado suma los únicos del mes y los cobros recurrentes cobrados: confirmados como cobrados, con el monto confirmado, o anteriores al día en que se registró el gasto, con el monto de la regla. Proyectado suma lo efectuado y los cobros por confirmar o futuros con el monto de la regla; los marcados como no cobrados no cuentan.

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
La tarjeta de "Tus gastos" SHALL mostrar una barra que reparte lo proyectado en tres partes: lo efectuado, lo por confirmar y lo que falta por cobrar, con los montos de las dos últimas.

#### Scenario: Partes de la barra
- **WHEN** lo efectuado es $339.00, Renta ($1,500.00) está por confirmar e Internet ($450.00) aún no llega
- **THEN** la barra muestra $1,500.00 por confirmar y $450.00 por cobrar

### Requirement: Atajos de Tus gastos a Análisis
La tarjeta de "Tus gastos" SHALL tener los botones "Por categoría" y "Por método". Cada uno SHALL cambiar a la vista "Análisis" del mismo mes y desplazarla hasta esa sección.

#### Scenario: Ir a Por categoría
- **WHEN** el usuario toca "Por categoría" en "Tus gastos" de noviembre 2026
- **THEN** se muestra "Análisis" de noviembre 2026 con la sección "Por categoría" a la vista

#### Scenario: Ir a Por método
- **WHEN** el usuario toca "Por método" en "Tus gastos"
- **THEN** se muestra "Análisis" con la sección "Por método" a la vista

### Requirement: Buscar en la lista de Tus gastos
Arriba de la lista de "Tus gastos" SHALL haber un buscador que filtra los cargos cuyo nombre o descripción, categoría o método de pago contenga el texto, sin distinguir mayúsculas ni acentos. Con texto SHALL indicar cuántos cargos coinciden y, si ninguno, un mensaje. La búsqueda no SHALL cambiar las cifras de la tarjeta.

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

### Requirement: Orden de la lista de Tus gastos
La lista de "Tus gastos" SHALL ordenarse por fecha de cobro de la más antigua a la más reciente; en la misma fecha, por la hora en que se registró el gasto y luego por nombre. Un botón SHALL invertir el orden y mostrar el orden vigente. El orden elegido SHALL conservarse al cerrar y volver a abrir la app; sin uno elegido, SHALL ser de la más antigua a la más reciente.

#### Scenario: Mismo día
- **WHEN** el 11/11/2026 hay dos gastos únicos, "Tacos" registrado a las 14:20 y "Súper" registrado a las 18:47
- **THEN** "Tacos" aparece antes que "Súper"

#### Scenario: Invertir el orden
- **WHEN** el usuario toca el botón de orden
- **THEN** la lista muestra primero el cargo más reciente y el botón indica "Más reciente"

#### Scenario: Orden conservado al volver a abrir la app
- **WHEN** el usuario cambia el orden a "Más reciente", cierra la app y la vuelve a abrir
- **THEN** la lista de "Tus gastos" muestra primero el cargo más reciente y el botón indica "Más reciente"

#### Scenario: Sin orden elegido
- **WHEN** el usuario abre la app por primera vez
- **THEN** la lista muestra primero el cargo más antiguo y el botón indica "Más antiguo"

### Requirement: Estado de cada cobro en la lista
En la lista de "Tus gastos", un cobro recurrente cuya fecha es posterior a hoy y no tiene confirmación SHALL verse tenue con la marca "Por cobrar". Un cobro marcado como no cobrado SHALL verse tenue, sin color y tachado, con la marca "No se cobró". Un cobro confirmado con otro monto SHALL mostrar el monto confirmado y el esperado.

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
Junto al título "Costo mensual promedio" SHALL haber un botón de información que muestra una explicación: es el costo de vida mensual (fijos, la parte mensual de lo que se paga cada varios meses y los únicos del mes), no lo cobrado este mes, que está en "Tus gastos".

#### Scenario: Ver la aclaración
- **WHEN** el usuario toca el botón de información del costo mensual promedio
- **THEN** aparece la explicación, que remite a "Tus gastos" para ver lo cobrado, y se cierra al tocar "Entendido"
