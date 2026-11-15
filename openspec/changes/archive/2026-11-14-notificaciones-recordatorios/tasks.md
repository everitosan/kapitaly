# Tasks

## 1. Dependencia y configuración nativa

- [x] 1.1 Instalar `expo-notifications` con `npx expo install` y revisar en la documentación v58 las firmas de `scheduleNotificationAsync` (disparadores `DAILY` y `DATE`), canales, permisos y respuesta a notificaciones. Agregar el plugin en `app.json` (`icon`, `color`, `defaultChannel: reminders`) con el ícono monocromo `assets/images/notification-icon.png`. Verificación: `npx expo config --type public` muestra el plugin y `npx expo-doctor` no reporta problemas nuevos.
- [x] 1.2 Agregar a `jest.setup.ts` un mock de `expo-notifications` con las funciones que se usen. Verificación: la suite corre.

## 2. Preferencias

- [x] 2.1 Dominio `src/domain/reminderSettings.ts`: tipo, valores por omisión, validación (horas `HH:MM`, días 1–14) y "hora efectiva del desuso". Verificación: pruebas unitarias.
- [x] 2.2 Tabla `reminder_settings` en `schema.ts` con su migración de Drizzle (fila por omisión con todo apagado), `ReminderSettingsRepository` (`get`, `update`, `subscribe`) en memoria y en SQLite, y pruebas de contrato. Verificación: las pruebas de contrato pasan en las dos versiones, y también las de actualización de base existente (`upgrade.test.ts`).

## 3. Plan de avisos (dominio puro)

- [x] 3.1 `planReminders(prefs, data, now)` en `src/domain/reminders.ts`: diario `DAILY`; cobros y vencimientos por día en una ventana de 60 días (máximo 40), sin lo ya confirmado o pagado, agrupados con los textos del spec; desuso a n, 2n y 3n desde el último registro (único o recurrente); ids estables y `target`. Verificación: pruebas con fechas fijas para cada escenario del spec `reminders` (un cobro, vencimiento, varios el mismo día, confirmado antes de la hora, desuso sin registrar y con registro, hora compartida o propia, apagado).

## 4. Sincronización con el sistema

- [x] 4.1 `scheduler.ts` con `ensureChannel`, `permissionStatus`, `requestPermission` y `sync(plan)` (cancelar los propios y agendar el plan). Verificación: pruebas con el mock que comprueban lo cancelado y lo agendado.
- [x] 4.2 Hook `useReminderSync()` montado en el layout raíz: se suscribe a las preferencias y repositorios, agrupa cambios (~500 ms), sincroniza al abrir y al volver a primer plano, y no agenda nada sin permiso. Verificación: pruebas de "Nuevo recurrente" y "Apagar" del spec con repositorios en memoria y el mock.

## 5. Pantalla Notificaciones y Ajustes

- [x] 5.1 `NotificationsScreen` y la ruta `settings/notifications` según la maqueta: interruptores, horas con el selector nativo, días de 1 a 14, hora del desuso compartida o propia con "Usar la del recordatorio diario", la nota del resultado y los textos aprobados. Verificación: pruebas de componente de los escenarios de pantalla (todo apagado al inicio, encender muestra la hora, hora compartida o propia).
- [x] 5.2 Flujo de permiso: pedirlo al encender, estado "Notificaciones bloqueadas" con "Abrir ajustes del sistema", y revisarlo al abrir la pantalla. Verificación: pruebas con el permiso concedido, negado y revocado.
- [x] 5.3 Fila "Notificaciones" en Ajustes con el resumen ("Apagadas", "1 activa", "N activas"), entre Categorías y Acceso directo. Verificación: pruebas de `SettingsScreen` actualizadas a los escenarios modificados de `settings-menu`.

## 6. Al tocar una notificación

- [x] 6.1 Listener de respuesta en el layout raíz: `new-expense` va a `/expense/new?quick=1` y `pending` abre el balance con la hoja (parámetro `pending=1` en `BalanceScreen`). Si la notificación abrió la app desde cero, el splash no se anima. Verificación: pruebas de navegación con respuestas simuladas, y prueba de `shouldAnimateSplash` con respuesta inicial.

## 7. Cierre

- [x] 7.1 Ejecutar `npm test`, `npm run typecheck` y `npm run lint`. Verificación: los tres pasan.
- [x] 7.2 Probar en el teléfono con una beta: permiso, recordatorio diario a una hora cercana, aviso de un cobro de prueba, aviso por desuso con n = 1, tocar cada notificación, y que llegue tras reiniciar el teléfono. Verificación: lo confirma el usuario.
