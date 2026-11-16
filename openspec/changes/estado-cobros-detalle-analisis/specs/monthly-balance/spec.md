## MODIFIED Requirements

### Requirement: Fechas y orden del detalle de categoría
En el detalle, un gasto mensual SHALL mostrar la fecha de su cobro en el mes, uno de intervalo mayor a un mes la de su próximo cobro (la misma de la lista de Prorrateados) y un único su fecha. La lista SHALL ordenarse por fecha, de la más antigua a la más reciente; en la misma fecha, por nombre. Una fecha de otro año que el mes consultado SHALL mostrar el año. Un gasto sin fecha SHALL mostrar un guion e ir al final. Cada fila SHALL indicar el estado de su gasto en el mes consultado, con el mismo criterio de "Estado de cada cobro en la lista": un mensual vencido sin confirmar con la marca "Por confirmar"; un mensual futuro, tenue, con "Por cobrar"; un mensual no cobrado, tenue y sin tachar, con "No se cobró"; un prorrateado, tenue, con "Prorrateo". Los únicos, los mensuales cobrados y los que no tienen cobro en el mes no SHALL llevar marca. El estado no SHALL cambiar montos, suma ni orden.

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

#### Scenario: Estados en el detalle
- **WHEN** hoy es 21/11/2026 y en noviembre 2026 "Hogar" tiene el único "Focos" (03/11/2026), Agua mensual (día 10) confirmada como cobrada, Luz mensual (día 18) sin confirmar, Internet mensual (día 28) y un Seguro de hogar anual
- **THEN** en el detalle de Hogar, Focos y Agua no llevan marca, Luz muestra "Por confirmar", Internet se ve tenue con "Por cobrar" y el Seguro de hogar se ve tenue con "Prorrateo"

#### Scenario: Cobro no realizado en el detalle
- **WHEN** la Renta ($1,500.00, día 20) de noviembre 2026 se marcó como no cobrada
- **THEN** su fila del detalle se ve tenue con "No se cobró", sin tachar, y sus $1,500.00 siguen en la suma

#### Scenario: Monto confirmado distinto
- **WHEN** Netflix ($219.00 mensual) se confirmó como cobrado con $239.00 en noviembre 2026
- **THEN** su fila del detalle muestra $219.00 sin marca

#### Scenario: Mes futuro
- **WHEN** hoy es 21/11/2026 y se consulta diciembre 2026
- **THEN** en el detalle todos los mensuales con cobro en diciembre se ven tenues con "Por cobrar"

#### Scenario: Prorrateado que se cobra en el mes
- **WHEN** el Seguro anual tiene fecha de cobro 15/11/2026 y se consulta noviembre 2026
- **THEN** su fila se ve tenue con "Prorrateo" y muestra su parte mensual

#### Scenario: Gasto registrado después de su cobro
- **WHEN** un gasto mensual con día 1 se registró el 10/11/2026 y se consulta noviembre 2026
- **THEN** su fila del detalle no lleva marca

#### Scenario: Estado al lector de pantalla
- **WHEN** TalkBack llega a la fila de Internet del detalle
- **THEN** anuncia su concepto, monto, fecha y "por cobrar"

#### Scenario: Mismo estado en el detalle por método
- **WHEN** Internet se paga con "BBVA Azul" y el usuario abre BBVA Azul en "Por método"
- **THEN** Internet se ve tenue con "Por cobrar", igual que en el detalle por categoría
