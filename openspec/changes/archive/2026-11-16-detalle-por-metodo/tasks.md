# Tasks

## 1. Maqueta

- [x] 1.1 Revisar con el usuario `design/propose/detalle-por-metodo.html` en claro y oscuro (fila tocable con fondo activo, detalle bajo la barra, borde del color del método) y ajustar lo que pida antes de implementar. Verificación: el usuario aprueba la maqueta.

## 2. Dominio: filas por método

- [x] 2.1 En `src/domain/balance.ts`, renombrar `CategoryDetailItem` a `BreakdownDetailItem` (actualizar sus usos) y agregar `items` a `MethodBreakdownEntry`: `methodBreakdown` recibe las `parts` con su `detail`, agrupa los items por `paymentMethodId` y los ordena con `sortDetailItems`. Verificación: pruebas nuevas en `src/domain/__tests__/balance.test.ts`: BBVA Azul = Netflix (15/11/2026, $219.00) + Seguro anual (15/03/2027, $500.00) con suma igual al monto; física y digital del mismo método en una sola lista; un método archivado con cargos lista sus gastos. Las pruebas existentes de `byMethod` se actualizan solo para incluir `items`, y `npm test` pasa.

## 3. UI: detalle común y filas tocables

- [x] 3.1 Mover `CategoryDetail` y `detailLabel` de `src/ui/components/analysis.tsx` a `src/ui/components/breakdownDetail.tsx` como `BreakdownDetail({ items, year, color, testID = 'category-detail' })` y usarlo desde `CategoryDonut`. Verificación: las pruebas de `CategoryDonut` y de "detalle por categoría" en `BalanceScreen.test.tsx` pasan sin cambiar sus aserciones.
- [x] 3.2 En `MethodBreakdownCard` (`src/ui/components/balance.tsx`), agregar `year`, `selectedId` y `onSelect` opcionales. Con `onSelect`, cada fila es un `Pressable` (`accessibilityRole="button"`, etiqueta con nombre y monto, `accessibilityState { selected, expanded }`, fondo `colors.bg` si está abierta) y debajo de la fila abierta va `<BreakdownDetail testID="method-detail" color={methodGradient(method, theme).from} />`. Sin `onSelect`, la tarjeta se ve y se comporta como hoy. Verificación: pruebas en `src/ui/components/__tests__/components.test.tsx`: sin selección no hay detalle; con selección aparecen sus filas en orden justo después de su fila; tocar la fila llama `onSelect` con su id o con `null` si ya estaba abierta; tocar una fila del detalle no llama `onSelect`.
- [x] 3.3 En `src/features/balance/BalanceScreen.tsx`, agregar el estado `selectedMethod`, independiente de `selectedCategory`, pasarlo a `MethodBreakdownCard` con `year` y `onSelect`, y ponerlo en `null` durante el render si no está en `average.byMethod`. Verificación: pruebas en `BalanceScreen.test.tsx` con el escenario de noviembre: abrir BBVA Azul (Netflix y Seguro anual, $719.00); cambiar a Nu Débito; cerrar al tocar otra vez; Transporte y BBVA Azul abiertos a la vez; avanzar a diciembre con Nu Débito (sigue abierto) y con Efectivo abierto (se cierra y no reaparece al volver).

## 4. Verificación integral

- [x] 4.1 Correr `npm run lint`, `npm run typecheck`, `npm test` y `npx prettier --check` sobre los archivos cambiados. Verificación: todo pasa.
- [x] 4.2 Probar en el teléfono o emulador, en claro y oscuro: abrir y cerrar métodos, uno con física y digital, y uno con un prorrateado; con una categoría abierta a la vez. Verificación: el detalle se abre bajo la barra correcta, suma lo mismo que el método, se lee bien en ambos temas y TalkBack anuncia la fila como botón expandible y lee cada gasto completo.

## Workflow follow-up

- Hacer commit de la propuesta con la maqueta ("docs: propuesta y maqueta del detalle por método") antes del commit de la implementación, siguiendo el skill `flujo-ramas`.
- Si sale en una beta, agregar sus notas en `release-notes/<versionName>/whatsnew-en-US`.
- Archivar después de `detalle-por-categoria`, ya que este delta hace referencia a su requisito "Fechas y orden del detalle de categoría".
