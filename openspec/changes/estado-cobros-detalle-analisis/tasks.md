# Tasks

## 1. Maqueta

- [x] 1.1 Crear `design/propose/estado-cobros-detalle.html` (A-1 Duotono, claro y oscuro) con el detalle de "Hogar" del escenario de la spec: Focos, Agua cobrada, Luz "Por confirmar", Internet "Por cobrar", Renta "No se cobró" sin tachar y Seguro "Prorrateo". Compara la marca debajo del concepto contra en línea. Verificación: el usuario aprueba la maqueta antes de implementar.

## 2. Dominio: estado de cada fila

- [x] 2.1 En `src/domain/balance.ts`, cambiar `buildAverageView` a un objeto de opciones con `confirmations` y `registeredOn` (design.md §2) y agregar `status: DetailStatus` a `BreakdownDetailItem` (§1), calculado con `chargeStatus`. Actualizar sus usos y las pruebas existentes con un helper. Verificación: pruebas nuevas en `src/domain/__tests__/balance.test.ts` para el escenario de Hogar (estados `none`, `none`, `pending`, `future`, `prorated`), no cobrado (`skipped` con el monto en la suma), confirmado con otro monto (`none` y $219.00), mes futuro (todos `future`), prorrateado con cobro en el mes (`prorated`), cobro anterior al registro (`none`) y el mismo estado en `byMethod`. Las pruebas existentes conservan sus montos, y `npm test` pasa.

## 3. UI: filas con estado

- [x] 3.1 En `src/ui/components/breakdownDetail.tsx`, pintar las filas `future`, `skipped` y `prorated` tenues, la marca según el estado (sin tachar `skipped`) y el estado en `detailLabel`, según la maqueta aprobada. Verificación: pruebas en `src/ui/components/__tests__/components.test.tsx` en las que cada estado muestra su marca y `none` ninguna; la etiqueta accesible de Internet termina en "por cobrar"; y "No se cobró" no tiene estilo tachado.
- [x] 3.2 En `src/features/balance/BalanceScreen.tsx`, pasar `confirmations.data` y `registeredOnLocal` a `buildAverageView`. Verificación: prueba en `BalanceScreen.test.tsx` que, con una confirmación guardada y hoy 21/11/2026, al abrir una categoría y un método la fila futura muestra "Por cobrar" y la vencida "Por confirmar". Las pruebas de detalle existentes siguen pasando.

## 4. Verificación integral

- [x] 4.1 Correr `npm run lint`, `npm run typecheck`, `npm test` y `npx prettier --check` sobre los archivos cambiados. Verificación: todo pasa.
- [x] 4.2 Probar en el teléfono o emulador, en claro y oscuro: abrir categorías y métodos en el mes actual, uno pasado y uno futuro; confirmar un cobro desde la campana y ver que su marca desaparece del detalle. Verificación: las marcas coinciden con "Tus gastos" y TalkBack lee el estado de cada fila.

## Workflow follow-up

- Hacer commit de la propuesta con la maqueta ("docs: propuesta y maqueta del estado de cobros en el detalle") antes de la implementación, siguiendo el skill `flujo-ramas`.
- Si sale en una beta, agregar sus notas en `release-notes/<versionName>/whatsnew-en-US`.
