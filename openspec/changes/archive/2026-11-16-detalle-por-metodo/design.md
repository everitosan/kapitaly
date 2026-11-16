# Design

## Context

`detalle-por-categoria` agregó `CategoryDetailItem` y `items` a `CategoryBreakdownEntry` en `buildAverageView` (`src/domain/balance.ts`), y un componente privado `CategoryDetail` con `detailLabel` en `src/ui/components/analysis.tsx`. `byMethod` sale de las mismas `parts` a través de `methodBreakdown`, que hoy solo suma montos por `paymentMethodId` (física y digital comparten id). `MethodBreakdownCard` (`src/ui/components/balance.tsx`) pinta filas de `View` sin interacción; solo la usa `BalanceScreen`.

## Goals / Non-Goals

**Goals:**
- Un solo componente de detalle y una sola regla de filas, fechas y orden para categoría y método.

**Non-Goals:**
- Unificar las dos tarjetas en un componente genérico de "desglose": sus filas son distintas (leyenda con dona contra badge con barra).
- Animar el acordeón.

## Decisions

### 1. `CategoryDetailItem` se generaliza como `BreakdownDetailItem`

Se renombra el tipo, ya que ahora lo usan las dos tarjetas, y se conserva su forma (`key, kind, label, date, amountCents`). `methodBreakdown` recibe las mismas `parts` con su `detail` y agrupa también los `items`. `sortDetailItems` se reutiliza sin cambios.

**Alternativa descartada:** calcular las filas del método filtrando las de todas las categorías. Esto ata el detalle del método a la agrupación por categoría y obliga a reordenar.

### 2. Componente común `BreakdownDetail`

`CategoryDetail` y `detailLabel` salen de `analysis.tsx` a un archivo propio, `src/ui/components/breakdownDetail.tsx`, que exporta `BreakdownDetail({ items, year, color, testID })`. `CategoryDonut` lo importa sin cambiar su comportamiento. El `testID` por omisión sigue siendo `category-detail` y sus filas `detail-<key>`, así que las pruebas del cambio anterior siguen valiendo. El método usa `method-detail` para el contenedor y para el prefijo de sus filas (`rowTestIDPrefix`), para que no se repitan ids cuando un mismo gasto aparece en los dos detalles abiertos.

### 3. Filas tocables en `MethodBreakdownCard`

La tarjeta recibe `year`, `selectedId` y `onSelect`, con el mismo patrón de `CategoryDonut`. Cada fila pasa a `Pressable` con `accessibilityRole="button"`, una etiqueta (nombre, monto) y `accessibilityState { selected, expanded }`, y lleva el fondo `colors.bg` cuando está abierta. Si `onSelect` falta, la fila sigue siendo un `View`, por si la tarjeta se usa en otro lugar. El color del borde del detalle es `methodGradient(method, theme).from`.

### 4. Estado en `BalanceScreen`

`selectedMethod` es un estado propio, independiente de `selectedCategory`, y se ajusta durante el render igual que la categoría: si no está en `average.byMethod`, pasa a `null`.

## Risks / Trade-offs

- [Con un método y una categoría abiertos, la vista Análisis crece mucho] → Se acepta por la decisión de que sean independientes; cada uno se cierra con un toque.
- [Renombrar el tipo toca el código del cambio anterior] → El cambio se limita a nombres; las pruebas de `detalle-por-categoria` deben pasar sin cambiar sus aserciones.
