# Tasks

## 1. Textos visibles

- [x] 1.1 En `src/features/balance/BalanceScreen.tsx`, cambiar la etiqueta `{ value: 'this', label: 'Este mes' }` a `'Tus gastos'` y `METHOD_NOTE` a `...Lo real del mes está en "Tus gastos".`. No tocar `value: 'this'`, `"No hay cargos este mes"` ni `"No hay gastos para analizar este mes."`. Verificación: `grep -n '"Este mes"\|'"'"'Este mes'"'"'' src/features/balance/BalanceScreen.tsx` no devuelve nada y las dos frases de mes vacío siguen igual.
- [x] 1.2 En `src/ui/components/analysis.tsx`, cambiar la explicación del costo mensual promedio a `Lo cobrado está en &quot;Tus gastos&quot;.` y el comentario de la tarjeta (línea 15) a `Tarjeta de "Tus gastos"`. Verificación: `grep -n "Este mes" src/ui/components/analysis.tsx` no devuelve nada.

## 2. Comentarios y nombres de pruebas

- [x] 2.1 Actualizar los comentarios de `src/domain/uiPreferences.ts` y `src/features/balance/useBalanceSort.ts` a `Orden de la lista de "Tus gastos"`. No renombrar `BALANCE_SORT_KEY` ni su valor `'balance.sort'`, para no perder el orden guardado. Verificación: el valor de la clave no cambia en el diff.
- [x] 2.2 Cambiar "Este mes" por "Tus gastos" en las pruebas: nombres de `describe`/`it` en `src/domain/__tests__/balance.test.ts`, `src/domain/__tests__/uiPreferences.test.ts`, `src/features/paymentMethods/__tests__/CreditCard.test.tsx` y `src/features/pending/__tests__/PendingSheet.test.tsx`, y las búsquedas de la pestaña por nombre en `src/features/balance/__tests__/BalanceScreen.test.tsx` y `src/ui/components/__tests__/components.test.tsx`. Verificación: `npm test` pasa.

## 3. Verificación integral

- [x] 3.1 Revisar que no quede el nombre viejo en `src/`. Verificación: `grep -rn "Este mes" src` no devuelve nada, y `grep -rni "este mes" src` solo devuelve "No hay cargos este mes", "No hay gastos para analizar este mes.", "No se cobró este mes" y "No es lo que salió de tu cuenta este mes".
- [x] 3.2 Correr `npm run lint`, `npm run typecheck`, `npm run format:check` y `npm test`. Verificación: lint, typecheck y test terminan sin errores; `prettier --check` pasa en los archivos cambiados (`format:check` global ya reportaba 40 archivos antes de este cambio).
- [x] 3.3 Probar en el teléfono o emulador. Verificación: el selector dice `Tus gastos | Análisis` en el mes actual y al cambiar a otro mes; la nota de "Por método" y la "i" del costo mensual promedio remiten a "Tus gastos"; el orden de la lista elegido antes del cambio se conserva.

## Workflow follow-up

- Si sale en la siguiente beta de `release/0.1.0`, agregar `release-notes/0.1.0-beta.9/whatsnew-en-US` que mencione el nombre nuevo de la sección (en inglés, por ejemplo "Your expenses"), siguiendo el skill `flujo-ramas`.
- Archivar el cambio con `/opsx:archive` para pasar los deltas a `monthly-balance`, `pending-review` y `credit-cards`.
