# Proposal

## Why

"Por método" de Análisis muestra cuánto suma cada método de pago al mes, pero no qué gastos lo forman. "Por categoría" ya tiene ese detalle en acordeón (`detalle-por-categoria`), así que el mismo gesto debe funcionar en la tarjeta de al lado.

## What Changes

- Cada fila de "Por método" se puede tocar. Al tocarla se abre debajo de su barra un acordeón con la lista de solo lectura de los gastos de ese método: fecha, concepto y monto. Tocarla otra vez lo cierra; abrir otro método cierra el anterior. La fila abierta lleva el fondo de fila activa.
- Las filas, montos, fechas y orden siguen las reglas del detalle por categoría: mensuales con su cobro en el mes, prorrateados con su parte mensual y su próximo cobro, únicos del mes con su fecha; por fecha, año solo si es otro, "—" al final. La suma es igual al monto del método.
- Las variantes física y digital de una tarjeta se juntan en el detalle, igual que en el monto, sin indicar cuál se usó.
- La selección de método es **independiente** de la de categoría: puede haber una categoría y un método abiertos a la vez.
- Al cambiar de mes, si el método abierto no tiene gastos en el mes nuevo, se cierra.
- El detalle de solo lectura pasa a ser un componente común que usan las dos tarjetas.

**Fuera de alcance:** editar desde el detalle, distinguir física y digital, y cambios en el monto, el orden o la barra de cada método.

## Capabilities

### New Capabilities
<!-- Ninguna -->

### Modified Capabilities
- `monthly-balance`: "Costo mensual por método de pago" agrega el detalle en acordeón del método activo.

## Impact

- **Dominio:** `src/domain/balance.ts`: `MethodBreakdownEntry` gana `items` con la misma forma y orden que el detalle por categoría.
- **UI:** el detalle de `src/ui/components/analysis.tsx` se mueve a un componente común; `MethodBreakdownCard` (`src/ui/components/balance.tsx`) hace sus filas tocables y abre el detalle. `BalanceScreen.tsx` guarda el método activo y lo cierra si no existe en el mes.
- **Diseño:** maqueta `design/propose/detalle-por-metodo.html` (A-1 Duotono, claro y oscuro).
- **Depende de:** `detalle-por-categoria` (ya en `release/0.1.0`).
- **Datos y nativo:** sin cambios; solo JS.
