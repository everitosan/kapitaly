# Tasks

## 1. Pruebas con React Compiler

- [x] 1.1 Revisar en `babel-preset-expo` (SDK 58) cómo configura `babel-plugin-react-compiler` y aplicar la misma configuración en `babel.config.js` solo para pruebas. Verificación: compilar `src/features/pending/usePending.ts` con la configuración de Jest genera código memoizado (`_c(`), y la suite completa corre.
- [x] 1.2 Revisar cada prueba que falle con el compilador: corregir los bugs reales pequeños y ajustar las pruebas frágiles. Anotar en `design.md` lo que se deje fuera. Verificación: `npm test` pasa con el compilador activo.
- [x] 1.3 Agregar una prueba que reproduzca el bug: en la hoja con dos pendientes, "Aún no" en uno lo quita de la hoja y baja el conteo. Verificación: la prueba falla con el código actual y el compilador activo.

## 2. Posponer como estado de React

- [x] 2.1 Convertir `pendingSession` en un store suscribible (`subscribe` / `getSnapshot`) con un `Set` inmutable y `autoDismissed`, agregar `usePendingSession()` con `useSyncExternalStore`, y hacer que `usePending` filtre con ese snapshot. Quitar `setSessionTick` y `onSnooze`. Verificación: la prueba 1.3 pasa, junto con las pruebas de `pending` y `quick-add` (hoja automática, siguiente apertura con `reset()`).

## 3. Campana

- [x] 3.1 Agregar los tokens `alert.bg` y `alert.ink` en claro y oscuro en `src/ui/theme.ts`. Verificación: una prueba en `theme.test.ts` comprueba un contraste ≥ 4.5:1 en los dos temas.
- [x] 3.2 Agregar la campana a `BalanceTopBar` (`pendingCount`, `onOpenPending`): píldora activa con el número, o ícono tenue y deshabilitado, con etiquetas de accesibilidad. Verificación: pruebas de componente para los dos estados, con el número visible, `disabled` y la etiqueta.
- [x] 3.3 En `BalanceScreen`, conectar la campana a `forceSheet` y quitar el aviso `pending-banner` y sus estilos. Verificación: pruebas de los escenarios del spec (con pendientes, sin pendientes, sin aviso en la lista, posponer el último cierra la hoja y deja la campana inactiva, cerrar y volver con la campana). Las pruebas existentes que usaban `pending-banner` pasan a usar la campana.

## 4. Botones de la hoja y regla de UI

- [x] 4.1 Reordenar los botones de `PendingSheet`: cobro `[Aún no][No se cobró]` + "Sí, se cobró" abajo a todo lo ancho; pago `[Aún no][Sí, pagué]`. Verificación: una prueba comprueba el orden de los botones en cada tarjeta.
- [x] 4.2 Escribir la regla "cancelar o posponer a la izquierda; confirmar a la derecha o abajo" en `src/ui/README.md`. Verificación: el texto existe y coincide con `design.md`.

## 5. Cierre

- [x] 5.1 Ejecutar `npm test`, `npm run typecheck` y `npm run lint`. Verificación: los tres pasan.
## 6. Posponer 6 horas (tras la beta 6)

- [x] 6.1 Dominio `src/domain/pendingSnooze.ts` (`SNOOZE_HOURS`, `snoozeUntil`, `isSnoozed`) y tabla `pending_snoozes` con migración, `PendingSnoozeRepository` (`list`, `snooze`, `purgeExpired`, `subscribe`) en memoria y SQLite. Verificación: pruebas unitarias en los bordes del plazo, pruebas de contrato en las dos versiones y prueba de actualización de base (`upgrade.test.ts`).
- [x] 6.2 `pendingSession` lee del repositorio: snapshot con lo pospuesto vigente y el vencimiento de `sheet`; se recalcula al cambiar el repositorio, al volver a primer plano y al próximo vencimiento. Verificación: pruebas con reloj falso de "Abrir la app dentro del plazo", "Pasado el plazo" y "Plazo vencido con la app abierta".
- [x] 6.3 "Aún no" pasa a "Posponer" en las dos tarjetas, con el aviso "Volveré a avisarte dentro de 6 hrs"; "Cerrar" pospone la apertura automática 6 horas; `purgeExpired()` al abrir. Verificación: pruebas de "Posponer uno de dos" (con el aviso), "Cerrar y volver a abrir la app", "Pasadas 6 horas de cerrar la hoja" y el orden de botones con "Posponer". Las pruebas existentes que usan "Aún no" se actualizan.
- [x] 6.4 Ejecutar `npm test`, `npm run typecheck` y `npm run lint`. Verificación: los tres pasan.

## 7. Verificación en dispositivo

- [x] 7.1 Probar en el teléfono con la beta: "Posponer" quita la tarjeta y muestra el aviso; al cerrar y abrir la app dentro de 6 horas no vuelve; "Cerrar" evita que la hoja salte sola al volver a abrir; la campana cuenta y se apaga correctamente. Verificación: lo confirma el usuario.
