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

## ADDED Requirements

### Requirement: Categoría en la vista Promedio
Cada gasto recurrente y único de la vista "Promedio" SHALL mostrar el ícono y el nombre de su categoría; un gasto de una categoría borrada SHALL mostrarse con "Otro".

#### Scenario: Categoría en la vista Promedio
- **WHEN** Renta tiene la categoría "Hogar"
- **THEN** su fila en "Promedio" muestra el ícono y el nombre "Hogar"
