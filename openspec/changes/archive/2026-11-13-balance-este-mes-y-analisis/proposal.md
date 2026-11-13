# Proposal

## Why

El balance mezcla dos preguntas distintas en la misma pantalla: "¿cuánto ha salido este mes?" y "¿cuánto me cuesta vivir al mes?". "Este mes" suma con el monto esperado aunque el cobro aún no llegue, se haya cobrado otro monto o no se haya cobrado, así que su total no es lo que realmente salió. "Promedio" es una lista larga sin forma de buscar ni de ver en qué se va el dinero. Además, el botón de Ajustes queda pegado a las flechas del mes y se confunde con ellas, y se perdió el acceso rápido a Métodos de pago, que sirve para ver lo usado en cada tarjeta.

## What Changes

- **"Este mes" separa lo efectuado de lo proyectado.** La tarjeta muestra lo efectuado ("$19,728.00") y debajo "de $32,127.00 proyectados", con una barra que distingue lo cobrado, lo que falta confirmar y lo que falta por cobrar. Lo efectuado suma los únicos y los recurrentes confirmados como cobrados, con el **monto real confirmado**. Lo proyectado suma lo efectuado más lo pendiente y lo futuro con su monto esperado; un cobro marcado como "no se cobró" no cuenta. **BREAKING** (de comportamiento): hoy las cifras de "Este mes" usan siempre el monto de la regla.
- **Atajos desde la tarjeta.** "Por categoría ›" y "Por método ›" abren la vista Análisis y la desplazan hasta esa sección.
- **Lista de "Este mes" más útil.** Buscador arriba que filtra por nombre, categoría o método. Orden por fecha de cobro, lo más antiguo primero; en el mismo día, por hora de registro. Un botón invierte el orden. Los cobros recurrentes que aún no llegan se ven tenues con la marca "Por cobrar"; los marcados "no se cobró" se quedan, tenues, en gris y tachados. El desglose por método sale de "Este mes".
- **"Promedio" pasa a llamarse "Análisis"** y se enfoca en el costo de vida mensual:
  - **Costo mensual promedio:** la misma cifra de hoy (fijos + prorrateados + únicos del mes), con un botón ⓘ que aclara que es costo de vida, no lo cobrado. Las píldoras Fijos, Prorrateados y Únicos se pueden tocar y abren un modal con su total, un buscador y la lista de esos gastos. La lista "Proporcional por gasto" y "Únicos del mes" salen de la vista y viven en esos modales.
  - **Por categoría:** gráfica de dona con el costo mensual (con prorrateo) por categoría y su leyenda con monto y porcentaje; tocar una categoría la resalta.
  - **Por método:** el desglose por método, ahora con prorrateo, con la aclaración de que es un estimado y no lo cobrado.
- **Encabezado del balance.** Una fila propia arriba con dos íconos discretos: tarjeta (abre Métodos de pago) y engrane (abre Ajustes). Las flechas del mes quedan solas junto al mes.
- **Diseño primero:** la maqueta está en `design/propose/duotono-redesign.html`.

**Fuera de alcance:** buscar en otros meses o en todo el historial, filtros por categoría o método en la lista, editar una confirmación desde la lista, cambiar cómo se calcula el costo mensual promedio, y pestañas inferiores.

## Capabilities

### New Capabilities
<!-- Ninguna: todo cabe en capacidades existentes. -->

### Modified Capabilities
- `monthly-balance`: "Este mes" pasa a efectuado vs. proyectado con montos confirmados, lista con buscador, orden reversible y estados visuales, y pierde el desglose por método; "Promedio" se renombra "Análisis" con aclaración, modales con buscador, gráfica por categoría y desglose por método con prorrateo.
- `settings-menu`: el encabezado del balance tiene un ícono de Ajustes y otro de Métodos de pago, separados de las flechas del mes; se elimina la regla de no tener acceso directo a métodos de pago.
- `credit-cards`: el escenario "Los pagos no son gastos" se refiere a "Análisis" en lugar de "Promedio".

## Impact

- **Dominio:** `src/domain/balance.ts` recibe las confirmaciones para calcular efectuado y proyectado, el estado de cada cargo y su hora de registro; nuevas funciones para el costo mensual por categoría y por método. Pruebas en `src/domain/__tests__/balance.test.ts`.
- **UI:** `BalanceScreen` se reorganiza y se parte en las dos vistas; `MonthSwitcher` pierde el botón de menú y aparece una barra superior; nuevos componentes de buscador, gráfica de dona (con `react-native-svg`, ya instalado) y modal de lista; `ExpenseRow` admite los estados "Por cobrar" y "No se cobró"; `TotalCard` admite el formato efectuado/proyectado y píldoras tocables.
- **Navegación:** `src/app/index.tsx` agrega la ruta a Métodos de pago desde el balance.
- **Sin dependencias nuevas** ni cambios en la base de datos.
