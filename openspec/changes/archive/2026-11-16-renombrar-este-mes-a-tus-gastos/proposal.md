# Proposal

## Why

La sección "Este mes" no siempre muestra el mes en curso: con el selector de mes se puede ver octubre o diciembre, y el nombre deja de tener sentido. "Tus gastos" describe lo que muestra (los cargos del mes elegido) sin importar el mes.

## What Changes

- El selector de la pantalla de balance pasa de `Este mes | Análisis` a `Tus gastos | Análisis`.
- Los textos que mandan a esa sección se actualizan:
  - la nota de "Por método" en Análisis: `Lo real del mes está en "Tus gastos".`
  - la explicación del costo mensual promedio: `Lo cobrado está en "Tus gastos".`
- Las specs que nombran la sección (`monthly-balance`, `pending-review`, `credit-cards`) usan el nombre nuevo, incluidos los títulos de requisitos.
- Los comentarios del código y los nombres de pruebas que mencionan la sección usan el nombre nuevo.

El comportamiento, las cifras y la vista inicial no cambian.

**Fuera de alcance:**
- Frases donde "este mes" no es el nombre de la sección: "No hay cargos este mes", "No hay gastos para analizar este mes." y el botón "No se cobró este mes".
- Identificadores internos (`'this'`, `theme.totals.thisMonth`).
- Las maquetas históricas de `design/propose/`.

## Capabilities

### New Capabilities
<!-- Ninguna -->

### Modified Capabilities
- `monthly-balance`: la vista "Este mes" se llama "Tus gastos" en el selector, en los textos que remiten a ella y en sus requisitos.
- `pending-review`: el escenario que nombra el selector usa "Tus gastos | Análisis".
- `credit-cards`: el escenario de pagos que no son gastos nombra "Tus gastos".

## Impact

- **Código:** `src/features/balance/BalanceScreen.tsx` (etiqueta del selector y nota de "Por método") y `src/ui/components/analysis.tsx` (explicación y comentario). Comentarios en `src/domain/uiPreferences.ts` y `src/features/balance/useBalanceSort.ts`.
- **Pruebas:** nombres de `describe`/`it` en varias suites y las búsquedas de la pestaña por nombre en `BalanceScreen.test.tsx` y `components.test.tsx`.
- **Datos:** ninguno. La vista elegida no se guarda con su etiqueta.
- **Publicación:** solo JS. Puede ir en la siguiente beta de `release/0.1.0` con sus notas de versión.
