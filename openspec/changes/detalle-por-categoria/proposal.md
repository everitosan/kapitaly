# Proposal

## Why

En "Por categoría" de Análisis se ve cuánto suma cada categoría al mes, pero no qué gastos forman esa cifra. Hoy, para saberlo, hay que abrir Fijos, Prorrateados y Únicos por separado y buscar la categoría en cada uno.

## What Changes

- Al activar una categoría (desde la leyenda o la dona), además de resaltarla en la gráfica, se abre un acordeón justo debajo de su fila en la leyenda con el detalle de esa categoría. Tocarla otra vez lo cierra; activar otra cierra el anterior.
- El detalle es una lista mínima de solo lectura con tres columnas: fecha, concepto y monto. No usa la fila de gasto de "Tus gastos" y tocar una fila no hace nada.
- Las filas son lo que forma la cifra de la categoría, así que su suma es igual al monto de la leyenda:
  - recurrentes mensuales: su monto, con la fecha de su cobro en el mes;
  - recurrentes de intervalo mayor a un mes: su parte mensual, con la fecha de su próximo cobro (la misma que muestra la lista de Prorrateados);
  - únicos del mes: su monto y su fecha.
- La lista se ordena por fecha, de la más antigua a la más reciente. Las fechas que no son del año del mes consultado muestran el año. Un gasto sin fecha (sin cobro en el mes o sin cobros próximos) muestra un guion y va al final.
- Al cambiar de mes, si la categoría activa no existe en el mes nuevo, el acordeón se cierra.
- El texto de la tarjeta "Por categoría" pasa de "Con lo prorrateado: así se reparte tu costo de vida." a "Incluye la parte proporcional de lo que pagas cada cierto tiempo, como un seguro anual. Así ves cuánto te cuesta tu estilo de vida.", que explica por qué un gasto anual aparece con su parte mensual.

**Fuera de alcance:** editar desde el detalle, buscar dentro del detalle y cambios en la vista "Tus gastos" o en los modales de Fijos, Prorrateados y Únicos.

## Capabilities

### New Capabilities
<!-- Ninguna -->

### Modified Capabilities
- `monthly-balance`: "Costo mensual por categoría" agrega el detalle en acordeón de la categoría activa.

## Impact

- **Dominio:** `src/domain/balance.ts` (`buildAverageView`) entrega, por categoría, las filas del detalle con fecha, concepto y monto mensual.
- **UI:** `CategoryDonut` en `src/ui/components/analysis.tsx` abre el acordeón bajo la fila activa con un componente de lista nuevo y mínimo. `BalanceScreen.tsx` cierra la selección si la categoría no existe en el mes y cambia el texto de la tarjeta.
- **Diseño:** maqueta `design/propose/detalle-por-categoria.html` (A-1 Duotono, claro y oscuro).
- **Pruebas:** dominio (filas, suma, fechas y orden) y pantalla (abrir, cerrar, cambiar de categoría y de mes).
- **Datos y nativo:** sin cambios; solo JS.
