# Tasks

## 1. Maqueta

- [x] 1.1 Maquetar en `design/propose/duotono-redesign.html`, con los tokens de A-1 Duotono y en claro y oscuro: encabezado con tarjeta y engrane, "Este mes" (efectuado de proyectado, barra, atajos, buscador, orden y estados de fila), "Análisis" (aclaración, píldoras tocables, dona por categoría y método con prorrateo) y el modal de lista con buscador; aprobada por el usuario en la exploración.

## 2. Dominio: estado de cada cobro

- [x] 2.1 Agregar `chargeStatus` en `src/domain/confirmations.ts` (Decisión 1) y reescribir `pendingConfirmations` sobre la misma regla; verificar que las pruebas actuales de `confirmations.test.ts` siguen pasando y agregar casos de `charged` con monto confirmado, `skipped`, anterior al registro, `pending` y `future`.
- [x] 2.2 Cambiar `buildThisMonthView` para recibir confirmaciones, hoy y `registeredOn`, y devolver por cargo `status`, `amountCents`, `expectedCents` y `registeredAt`, y por vista `doneCents`, `pendingCents`, `futureCents` y `projectedCents`, sin `breakdown` ni subtotales (Decisión 2); verificar en `balance.test.ts` los escenarios "Total y conteo del mes", "Efectuado y proyectado", "Cobro no realizado", "Cobro anterior al registro", "Mes futuro" y "Partes de la barra".
- [x] 2.3 Agregar `sortCharges` (fecha → hora de registro → nombre, invertible) y `matchesSearch` en `src/domain/search.ts` (sin mayúsculas ni acentos) (Decisión 3); verificar con pruebas los escenarios "Mismo día", "Invertir el orden", "Filtrar por nombre" y "Filtrar por categoría sin acentos".

## 3. Dominio: repartos de Análisis

- [x] 3.1 Agregar `byCategory` y `byMethod` a `buildAverageView` (Decisión 4), resolviendo categorías borradas a "Otro" y agrupando variantes física/digital; verificar con pruebas "Reparto por categoría", "Desglose del mes" (con prorrateo), "El desglose suma física y digital", "Método archivado con cargos" y que ambas listas suman `totalCents`.

## 4. Componentes de UI

- [x] 4.1 Crear `SearchField` en `src/ui/components` (con botón para borrar y `accessibilityLabel`) y verificar con una prueba de UI que escribir y borrar llama a `onChange`.
- [x] 4.2 Cambiar `ExpenseRow` recurrente a `status` y `expectedCents?` con los estilos "Por cobrar", "No se cobró" y "esperado $X" (Decisión 10); verificar con pruebas de UI los escenarios "Cobro futuro", "Cobro no realizado en la lista" y "Monto distinto al esperado", incluyendo el estado en el `accessibilityLabel`.
- [x] 4.3 Crear `MonthProgressCard` y `AverageTotalCard` en lugar de `TotalCard` (Decisión 12), con la aclaración ⓘ desplegable (Decisión 9) y píldoras tocables; verificar con pruebas de UI "Efectuado y proyectado", "Mes sin cargos" y "Ver la aclaración".
- [x] 4.4 Agregar la paleta categórica de 8 tonos en claro y oscuro con gris para "Otro" en `src/ui/theme.ts` y su asignación estable por categoría (Decisión 5), y crear `CategoryDonut` con `react-native-svg` y leyenda seleccionable (Decisión 6); verificar con pruebas de UI "Resaltar una categoría", "Sin gastos" y las etiquetas accesibles de la leyenda, y revisar a 360 px en claro y oscuro que los tonos se distinguen.
- [x] 4.5 Agregar a `MethodBreakdownCard` un texto de aclaración opcional; verificar con una prueba de UI "Aclaración visible".
- [x] 4.6 Crear `BalanceTopBar` con `CardIcon` y un nuevo `GearIcon`, y quitar `onMenu` de `MonthSwitcher` (y `MenuIcon` si queda sin uso) (Decisión 11); verificar con pruebas de UI los escenarios de `settings-menu` "Abrir el menú", "Abrir Métodos de pago desde el balance", "Botones separados de las flechas" y "Etiquetas accesibles".

## 5. Pantalla de balance

- [x] 5.1 Reorganizar "Este mes" en `BalanceScreen`: `MonthProgressCard`, buscador, botón de orden, conteo de coincidencias y lista sin `MethodBreakdownCard`, pasando confirmaciones y `registeredOnLocal` al dominio; verificar con pruebas de UI "Sin desglose por método", "Sin coincidencias", "Borrar la búsqueda" y que la marca "Por confirmar" sigue apareciendo.
- [x] 5.2 Reorganizar "Análisis" (renombrar la opción del selector): `AverageTotalCard`, dona por categoría y `MethodBreakdownCard` con prorrateo, sin "Proporcional por gasto" ni "Únicos del mes"; verificar con pruebas de UI "Cambio de vista", "Cambio de mes conservando la vista", "Sin lista suelta de gastos" y "Análisis ignora el monto confirmado".
- [x] 5.3 Crear `AnalysisListSheet` con la tarjeta del total en `ink`, buscador y filas, abierto desde cada píldora; al tocar una fila, cerrar el modal y luego navegar a la edición (Decisión 8); verificar con pruebas de UI "Abrir Prorrateados", "Buscar en Fijos", "Tocar un gasto del modal", "Categoría en la vista Promedio" y los escenarios de la pista en Prorrateados.
- [x] 5.4 Agregar `scrollRef` a `ScreenLayout` y el desplazamiento por `onLayout` a las secciones (Decisión 7) para los atajos "Por categoría" y "Por método"; verificar con pruebas de UI que el toque cambia a Análisis y llama a `scrollTo` con la posición de la sección, y en el teléfono que la sección queda a la vista.
- [x] 5.5 Agregar `onOpenMethods` a `BalanceScreen` y la ruta `/payment-methods` en `src/app/index.tsx`; verificar en Expo que la tarjeta abre Métodos de pago y el engrane abre Ajustes.

## 6. Verificación integrada

- [x] 6.1 Correr `npm test`, `npm run typecheck`, `npm run lint` y `openspec validate balance-este-mes-y-analisis --strict`, y revisar en Expo, en claro y oscuro y a 360 px, el flujo completo: confirmar un cobro con otro monto, marcar otro como no cobrado y ver la tarjeta, la barra y la lista; buscar e invertir el orden; usar los atajos; abrir los tres modales y buscar; tocar la dona y la ⓘ.

## Workflow follow-up

- Publicar en la siguiente beta según la skill `flujo-ramas` y verificarla en el teléfono.
- Archivar el cambio y sincronizar los specs `monthly-balance`, `settings-menu` y `credit-cards` cuando la beta esté verificada.
