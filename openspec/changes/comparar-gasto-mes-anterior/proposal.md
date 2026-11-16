# Proposal

> **Estado: en espera.** Se retoma cuando haya usuarios activos, como un update que aporte valor. Depende de `gasto-por-dia`.

## Why

El gasto por día muestra cuánto se gasta en lo que se decide cada día, pero sin un punto de referencia es difícil saber si se va mejor o peor. Comparar con el mes anterior a la misma altura ("vas $300 abajo que octubre a estas alturas") es lo que más motiva a cambiar un hábito. Se deja para después porque necesita al menos un mes completo de registros, y porque con pocos usuarios todavía no se sabe cómo se recibe, ya que puede leerse como un juicio.

## What Changes

- La tarjeta "Gasto del día a día" compara lo gastado en únicos hasta el día de hoy contra lo gastado en el mes anterior hasta el mismo día del mes: "vas $X abajo" o "vas $X arriba de <mes anterior> a estas alturas".
- La gráfica puede mostrar, tenue, el gasto del mes anterior para comparar.
- Sin mes anterior con registros, no se muestra ninguna comparación.
- El tono debe motivar sin regañar. Por ejemplo, destacar cuando se va abajo y ser neutral cuando se va arriba. Se define con maqueta.

**Por decidir al retomarla:** comparar contra el mes anterior o contra el promedio de los últimos meses; qué hacer con meses de distinta duración (por ejemplo, el 31 contra un mes de 30 días); y si la comparación también es premium.

## Capabilities

### New Capabilities
<!-- Ninguna -->

### Modified Capabilities
- `daily-spending`: agrega la comparación con el mes anterior (la capacidad nace en `gasto-por-dia`).

## Impact

- **Dominio:** cálculo del gasto en únicos acumulado al día N para dos meses.
- **UI:** la tarjeta "Gasto del día a día" de Análisis.
- **Depende de:** `gasto-por-dia` archivado.
