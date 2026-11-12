# Spec Delta

## MODIFIED Requirements

### Requirement: Vista Este mes
La vista "Este mes" SHALL mostrar los cobros de gastos recurrentes que caen en el mes seleccionado y los gastos únicos con fecha en ese mes. Incluye el número de cargos, el total exacto, los subtotales de recurrentes y de únicos, y una lista ordenada por fecha (y por nombre si empatan). Cada elemento muestra fecha, nombre o descripción, monto real, método de pago, el ícono y nombre de su categoría y una marca si es único. Los gastos eliminados no SHALL incluirse.

#### Scenario: Total y conteo del mes
- **WHEN** en noviembre 2026 caen Netflix ($219.00, día 15), Renta ($1,500.00, día 20) e Internet bimestral ($450.00, día 28), hay un gasto único "Recarga metro" ($100.00, día 8) y existe un seguro anual de $6,000.00 que se cobra en marzo
- **THEN** la vista muestra 4 cargos, un total de $2,269.00, subtotales de $2,169.00 en recurrentes y $100.00 en únicos, y la lista Recarga metro, Netflix, Renta, Internet en ese orden, sin el seguro

#### Scenario: Mes sin cargos
- **WHEN** en el mes seleccionado no cae ningún cobro ni hay gastos únicos
- **THEN** la vista muestra 0 cargos, un total de $0.00 y un mensaje indicando que no hay cargos ese mes

#### Scenario: Categoría en la fila
- **WHEN** Netflix tiene la categoría "Suscripciones" y se cobra en noviembre 2026
- **THEN** su fila en "Este mes" muestra el ícono y el nombre "Suscripciones"

#### Scenario: Categoría borrada
- **WHEN** "Smart Fit" tenía la categoría personalizada "Gimnasio" y esta se borró
- **THEN** su fila muestra "Otro"

### Requirement: Vista Promedio
La vista "Promedio" SHALL listar cada gasto recurrente vigente en el mes con su costo mensual proporcional (monto entre los meses del intervalo, redondeado al centavo) y cada gasto único del mes con su monto real; cada elemento muestra el ícono y nombre de su categoría. Su total es la suma de los montos mostrados, con subtotales de fijos mensuales, prorrateados y únicos. Un recurrente es vigente si su ancla es anterior o igual al último día del mes y su fecha de fin, si la tiene, es posterior o igual al primer día.

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

#### Scenario: Categoría en la vista Promedio
- **WHEN** Renta tiene la categoría "Hogar"
- **THEN** su fila en "Promedio" muestra el ícono y el nombre "Hogar"
