# Design

## Context

- `buildAverageView(recurring, oneOffs, year, month, today, lookups)` en `src/domain/balance.ts` arma las `parts` y, de ellas, `byCategory[].items` y `byMethod[].items` (`BreakdownDetailItem`: `key, kind, label, date, amountCents`). Hoy no recibe confirmaciones.
- `buildThisMonthView` ya calcula el estado de cada cobro con `chargeStatus(expense, date, confirmation, today, registeredOn)` (`src/domain/confirmations.ts`). Devuelve `charged | pending | future | skipped`, y `ExpenseRow` lo pinta en "Tus gastos": tenue con `styles.faded` (opacidad 0.42) y marcas "POR CONFIRMAR", "POR COBRAR" y "NO SE COBRÓ".
- `BreakdownDetail` (`src/ui/components/breakdownDetail.tsx`) es la fila compacta compartida por `CategoryDonut` y `MethodBreakdownCard`.

## Goals / Non-Goals

**Goals:**
- Que el detalle y "Tus gastos" no puedan contradecirse sobre el estado de un cobro: la misma función calcula los dos.

**Non-Goals:**
- Reutilizar `ExpenseRow` en el detalle: su fila es grande y en bloque de color, y el detalle es una lista compacta.
- Cambiar montos o sumas de Análisis.

## Decisions

### 1. `status` en `BreakdownDetailItem`
Se agrega `status: DetailStatus`, donde `type DetailStatus = 'none' | 'pending' | 'future' | 'skipped' | 'prorated'`.
- Único → `none`.
- Prorrateado → `prorated`, siempre, aunque su cobro caiga en el mes. Su monto es la parte mensual y no un cobro.
- Mensual con cobro en el mes → `chargeStatus(...)`, traduciendo `charged` a `none`.
- Mensual sin cobro en el mes (`date === null`) → `none`.

**Alternativa descartada:** reusar `ChargeState` y dejar `charged` como "sin marca". Agregar `prorated` a `ChargeState` contaminaría "Tus gastos" con un estado que ahí no existe, y `none` deja claro que no se pinta nada.

### 2. `buildAverageView` recibe un objeto de opciones con las confirmaciones
La firma pasa a ser `buildAverageView({ recurring, oneOffs, confirmations, year, month, today, registeredOn, lookups })`, alineada con `ThisMonthInput`. Indexa las confirmaciones con `indexConfirmations`/`confirmationKey`, como `buildThisMonthView`. Las cifras siguen usando `monthlyCents` (el monto de la regla). La confirmación solo decide el estado.
- **Por qué un objeto:** con ocho parámetros, el orden posicional es frágil. Las pruebas existentes de `buildAverageView` se adaptan con un helper que llena `confirmations: []` y `registeredOn`.

### 3. Pintar el estado en `BreakdownDetail`
- **Fila tenue** (`opacity: 0.42`, el mismo valor que `faded`) para `future`, `skipped` y `prorated`.
- **Marca** como texto pequeño en mayúsculas con borde punteado, el mismo lenguaje de "POR COBRAR" en `ExpenseRow`, debajo del concepto: "POR CONFIRMAR", "POR COBRAR", "NO SE COBRÓ" o "PRORRATEO". `none` no lleva marca.
- `skipped` no se tacha, porque su monto sigue en la suma.
- `detailLabel` agrega el estado al final (", por confirmar", ", por cobrar", ", no se cobró"). Los prorrateados ya dicen "al mes, próximo cobro…", y se agrega ", prorrateo".
- La maqueta decide si la marca va debajo del concepto o junto a la fecha.

### 4. `BalanceScreen`
Pasa `confirmations.data` y `registeredOnLocal` a `buildAverageView`, igual que a `buildThisMonthView`. Las confirmaciones ya se cargan ahí con `useChargeConfirmations`.

## Risks / Trade-offs

- **[El detalle crece en altura por la marca bajo el concepto]** → La maqueta compara la marca debajo contra en línea. Lo tenue por sí solo ya distingue los estados.
- **[Pruebas de `buildAverageView` con la firma vieja]** → Se cambian en la misma tarea que la firma, y se comprueba que sus montos no cambian.
