# Tasks

## 1. Maqueta

- [x] 1.1 Revisar con el usuario `design/propose/detalle-por-categoria.html` en claro y oscuro (acordeón, columnas, fechas con año, borde del color de la categoría) y ajustar lo que pida antes de implementar. Verificación: el usuario aprueba la maqueta.

## 2. Dominio: filas del detalle

- [x] 2.1 En `src/domain/balance.ts`, agregar `CategoryDetailItem { key, label, date: CivilDate | null, amountCents }` y `items` a `CategoryBreakdownEntry`, llenándolos en el mismo recorrido que suma `amountCents`: mensual con `occurrenceInMonth`, intervalo mayor con `nextCharge` y único con su fecha. Ordenar por fecha ascendente, `null` al final y en empate por nombre (`localeCompare('es')`). Verificación: pruebas nuevas en `src/domain/__tests__/balance.test.ts` con los escenarios de la spec: Transporte = Recarga metro (08/11/2026, $100.00) + Seguro anual (15/03/2027, $500.00) y suma igual al total; Focos antes que Renta; mensual con fin antes del cobro → `null` al final; semestral sin cobros próximos → `null`. `npm test` pasa.

## 3. UI: acordeón y lista mínima

- [x] 3.1 En `src/ui/format.ts`, agregar `formatDetailDate(date, year)` (`8 nov`, `15 mar 2027`, `—`) y su variante accesible con el mes completo. Verificación: pruebas unitarias de los tres casos.
- [x] 3.2 En `src/ui/components/analysis.tsx`, agregar `items` a `DonutEntry` y un componente `CategoryDetail` de solo lectura (borde izquierdo del color de la categoría; fecha, concepto con una línea y monto alineado a la derecha; sin `Pressable` ni `ExpenseRow`), pintado justo debajo de la fila activa de la leyenda. La fila de la leyenda expone `accessibilityState.expanded`, y cada fila del detalle una etiqueta como "Seguro anual, $500.00 al mes, próximo cobro 15 de marzo de 2027". Verificación: pruebas en `src/ui/components/__tests__/components.test.tsx`: sin selección no hay detalle; con selección aparecen sus filas en orden debajo de su fila; tocar una fila del detalle no llama a `onSelect`.
- [x] 3.3 En `src/features/balance/BalanceScreen.tsx`, pasar `items` a `CategoryDonut` y limpiar `selectedCategory` cuando su id no esté en `average.byCategory` del mes mostrado. Verificación: pruebas en `src/features/balance/__tests__/BalanceScreen.test.tsx`: abrir desde la leyenda y desde la dona; cambiar de categoría; cerrar al tocar otra vez; avanzar a un mes con la categoría (sigue abierta con los gastos nuevos) y a uno sin ella (sin categoría activa, y al volver no reaparece abierta).

- [x] 3.4 En `src/features/balance/BalanceScreen.tsx`, cambiar el texto de la tarjeta "Por categoría" a "Incluye la parte proporcional de lo que pagas cada cierto tiempo, como un seguro anual. Así ves cuánto te cuesta tu estilo de vida.". Verificación: prueba en `BalanceScreen.test.tsx` que encuentra el texto nuevo en Análisis de un mes con gastos, y `grep -rn "Con lo prorrateado" src` no devuelve nada.

## 4. Verificación integral

- [x] 4.1 Correr `npm run lint`, `npm run typecheck` y `npm test`, y `npx prettier --check` sobre los archivos cambiados. Verificación: todo pasa.
- [x] 4.2 Probar en el teléfono o emulador, en claro y oscuro, con una categoría de varios gastos y un prorrateado. Verificación: el detalle se abre bajo la fila correcta, suma lo mismo que la leyenda, se lee bien en ambos temas y TalkBack lee cada fila completa.

## Workflow follow-up

- Hacer commit de la propuesta con la maqueta ("docs: propuesta y maqueta del detalle por categoría") antes del commit de la implementación, siguiendo el skill `flujo-ramas`.
- Si sale en una beta, agregar sus notas en `release-notes/<versionName>/whatsnew-en-US`.
- Archivar el cambio con `/opsx:archive` para pasar el delta a `monthly-balance`.
