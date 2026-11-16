# Design

## Context

`buildAverageView` (`src/domain/balance.ts`) ya arma `byCategory` sumando las partes de cada recurrente vigente (`monthlyCents`) y de cada único del mes, pero descarta de qué gasto viene cada parte. `CategoryDonut` (`src/ui/components/analysis.tsx`) recibe solo `{ id, name, amountCents, color }` por categoría y controla la selección con `selectedId`/`onSelect`; el estado vive en `BalanceScreen` (`selectedCategory`) y hoy no se limpia al cambiar de mes. Los prorrateados ya tienen `nextCharge` calculado desde `referenceDate`.

## Goals / Non-Goals

**Goals:**
- Que las filas del detalle salgan del mismo cálculo que el monto de la categoría, para que la suma coincida por construcción.
- Un componente de lista nuevo y mínimo, sin `ExpenseRow` ni `Pressable` por fila.

**Non-Goals:**
- Animar el acordeón. Se abre y se cierra sin transición; se puede agregar después sin tocar specs.
- Cambiar los colores, el tamaño o el comportamiento actual de la dona y la leyenda.

## Decisions

### 1. Las filas se calculan en el dominio, junto con el total

`CategoryBreakdownEntry` gana `items: CategoryDetailItem[]` con `{ key, kind, label, date: CivilDate | null, amountCents }`. `kind` (`monthly`, `prorated` u `oneOff`) solo sirve para la etiqueta accesible ("al mes, próximo cobro…"). Se llenan en el mismo recorrido de `parts` que hoy suma `amountCents`, así que la suma de `items` es el total de la categoría.

- Mensual (`monthsPerInterval === 1`): `date = occurrenceInMonth(expense, year, month)`.
- Intervalo mayor: `date = item.nextCharge` (ya calculado; `null` si no quedan cobros).
- Único: `date = charge.date`.
- Orden: fecha ascendente, `null` al final; en empate, `label` con `localeCompare('es')`.

**Alternativa descartada:** filtrar `items` y `oneOffs` por categoría en la UI. Duplica la regla de qué cuenta (vigencia, borrados, categoría "Otro" para borradas) y puede desviarse del total.

### 2. Formato de fecha en la UI

Helper nuevo en `src/ui/format.ts`: `formatDetailDate(date, year)` → `8 nov` si es del año consultado, `15 mar 2027` si no, y `—` para `null`. Reutiliza `MONTH_SHORT`. La etiqueta accesible usa el nombre completo del mes ("15 de marzo de 2027").

### 3. Acordeón dentro de `CategoryDonut`

`DonutEntry` gana `items`. Al pintar la leyenda, justo después de la fila activa se pinta `<CategoryDetail items year />`: un `View` con borde izquierdo del color de la categoría y filas de `Text` en tres columnas (fecha con ancho fijo, concepto con `numberOfLines={1}` y monto alineado a la derecha con cifras tabulares). La fila de la leyenda agrega `accessibilityState.expanded`.

### 4. Cerrar la selección cuando la categoría no existe en el mes

En `BalanceScreen`, durante el render, si `selectedCategory` ya no está en `average.byCategory` se pone en `null` (ajuste de estado en el render: un efecto lo prohíbe la regla `react-hooks/set-state-in-effect`). Se limpia el estado, en lugar de solo ocultarlo, para que al volver a un mes donde la categoría sí existe no reaparezca abierta sola, como pide la spec.

## Risks / Trade-offs

- [Una categoría con muchos gastos alarga la tarjeta y empuja "Por método" hacia abajo] → Se acepta: es la categoría que el usuario abrió y se cierra con un toque. Si molesta en uso real, se puede limitar a N filas con "ver todas".
- [El monto del prorrateado ($500) puede confundirse con lo que se cobrará] → La fecha del próximo cobro y el encabezado "al mes" de la tarjeta lo contextualizan; la maqueta lo valida antes de implementar.
