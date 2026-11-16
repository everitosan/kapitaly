# Proposal

## Why

El detalle por categoría y por método de Análisis lista los gastos que forman cada cifra, pero un cobro ya hecho se ve igual que uno futuro o que la parte prorrateada de un cobro anual. Así no se nota qué falta por pagar en el mes. "Tus gastos" ya distingue esos estados, y el detalle debe hablar el mismo lenguaje.

## What Changes

- Cada fila del detalle (por categoría y por método) muestra el estado de su gasto en el mes consultado:
  - **Único:** normal, sin marca.
  - **Mensual cobrado:** normal, sin marca. Incluye los confirmados y los anteriores al registro del gasto.
  - **Mensual vencido sin confirmar:** normal, con la marca "Por confirmar".
  - **Mensual futuro:** tenue, con "Por cobrar".
  - **Mensual marcado como no cobrado:** tenue, con "No se cobró", **sin tachado**, porque sigue sumando en la cifra de Análisis.
  - **Prorrateado** (intervalo mayor a un mes): tenue, con "Prorrateo", aunque su cobro caiga en el mes.
  - **Mensual sin cobro en el mes:** se queda como hoy, con un guion en la fecha y sin marca.
- Aplica en cualquier mes: en un mes futuro todos los mensuales salen "Por cobrar", y en uno pasado solo quedan los cobrados, vencidos o no cobrados.
- Montos, suma, fechas y orden no cambian. Análisis sigue usando el monto de la regla, confirmado o no.
- La etiqueta de accesibilidad de cada fila incluye su estado.

**Fuera de alcance:** una línea resumen de cobrado y pendiente arriba del detalle; mostrar el monto confirmado en el detalle; y cambiar cómo calcula Análisis.

## Capabilities

### New Capabilities
<!-- Ninguna -->

### Modified Capabilities
- `monthly-balance`: "Fechas y orden del detalle de categoría", que también rige el detalle por método, agrega el estado de cada fila.

## Impact

- **Dominio:** `src/domain/balance.ts`: `BreakdownDetailItem` gana `status`, y `buildAverageView` recibe las confirmaciones y `registeredOn` para calcularlo con `chargeStatus`, igual que `buildThisMonthView`.
- **UI:** `src/ui/components/breakdownDetail.tsx`: filas tenues y marca de estado. `BalanceScreen.tsx` pasa las confirmaciones a `buildAverageView`.
- **Diseño:** maqueta `design/propose/estado-cobros-detalle.html` (A-1 Duotono, claro y oscuro) antes de implementar.
- **Relación:** con `compra-unica-kapitaly-completo`, el aviso de candado reemplaza toda la lista, así que las marcas quedan dentro de lo premium. No hay conflicto entre los dos deltas, porque modifican requisitos distintos de `monthly-balance`.
- **Datos y nativo:** sin cambios; solo JS.
