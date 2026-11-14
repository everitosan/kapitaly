# Design

## Context

Ver `proposal.md` y los specs `reminders` y `settings-menu`. Estado actual relevante:

- Los datos viven en SQLite con Drizzle (`src/data/sqlite/schema.ts`, migraciones en `drizzle/`). Los repositorios tienen un contrato común (`contract.ts`), una versión en memoria y una SQLite, y avisan cambios con `subscribe`.
- Los pendientes ya se calculan en el dominio: `pendingConfirmations` (cobros) y `pendingCardPayment` (vencimientos). `usePending` los combina.
- El atajo "Nuevo gasto" abre `expense/new?quick=1`, y el splash no se anima con esa URL (`splashRules.ts`).
- `expo-notifications` no está instalado. La documentación de SDK 58 dice que:
  - hay disparadores `DAILY` y `DATE`, con `delivery: 'bestEffort'` por omisión;
  - sin `SCHEDULE_EXACT_ALARM` la hora es aproximada;
  - el plugin agrega `RECEIVE_BOOT_COMPLETED`;
  - en Android 8+ toda notificación va en un canal, y el diálogo de permiso de Android 13 solo aparece si ya existe uno.

## Goals / Non-Goals

**Goals:** que el cálculo de qué agendar sea puro y probado; que lo agendado sea un reflejo idempotente de las preferencias y los datos; que la pantalla siga la maqueta.

**Non-Goals:** push remotas, tareas en segundo plano y alarmas exactas.

## Decisions

### 1. Notificaciones locales, sin tareas en segundo plano

Todo se agenda por adelantado, en lugar de "detectarse" después:

- **Diario:** un solo `DAILY` (hora, minuto) que repite el sistema.
- **Cobros:** un `DATE` por día con pendientes, dentro de una ventana de 60 días y con un máximo de 40.
- **Desuso:** tres `DATE`, en *último registro* + n, + 2n y + 3n, a la hora del desuso.

Así no hacen falta tareas en segundo plano. Si la app no se abre, el aviso de desuso sale como máximo tres veces y los avisos de cobros cubren los próximos 60 días.

*Alternativa descartada:* `expo-background-task` para revisar periódicamente. El sistema no garantiza cuándo corre y suma complejidad sin necesidad.

### 2. Dominio puro: `planReminders`

```
planReminders(prefs, data, now) -> ScheduledReminder[]
  ScheduledReminder = { id, kind: 'charges'|'daily'|'idle', trigger, title, body, target }
  target = 'pending' | 'new-expense'
```

Vive en `src/domain/reminders.ts`, sin Expo:

- **Cobros:** para cada día de la ventana (desde hoy, si la hora aún no pasa, o desde mañana), usa las mismas reglas de dominio para saber qué estaría pendiente ese día, sin contar lo ya confirmado o pagado.
- **Agrupación por día:**
  - Un cobro: "Hoy se cobra {nombre}" con "{monto} con {método}. Confírmalo cuando pase."
  - Un vencimiento: "Hoy vence {tarjeta}" con "Usado {monto}. Toca para registrar el pago."
  - Varios: "Hoy tienes {N} pendientes" y los nombres en el cuerpo.
- **Ids estables** (`charges|2026-11-15`, `daily`, `idle|1`…), para poder comparar y reemplazar.
- **Último registro:** el `createdAt` más reciente entre los gastos únicos y recurrentes vigentes. Confirmar un cobro no cuenta, porque no registra un gasto nuevo. Sin gastos registrados, la cuenta empieza desde hoy, es decir, desde la última vez que la app recalculó el plan (al abrirla o al cambiar algo). Así no hace falta guardar otra fecha.

Se prueba con fechas fijas y cubre los escenarios del spec.

### 3. `ReminderScheduler`: sincronizar con el sistema

Es el único módulo que importa `expo-notifications` (`src/features/reminders/scheduler.ts`). La función `sync(plan)`:

1. Crea o actualiza el canal Android `reminders` ("Recordatorios").
2. Cancela lo agendado por la app (`getAllScheduledNotificationsAsync` y `cancelScheduledNotificationAsync` de los ids propios).
3. Agenda el plan con `scheduleNotificationAsync`, poniendo `data: { target }`.

Con cancelar todo y volver a agendar basta: son pocas notificaciones y así no se acumulan errores de estado. Las firmas exactas se revisan en la documentación v58 antes de escribir.

Un hook `useReminderSync()`, montado una vez debajo de `RepositoryProvider`:

- se suscribe a las preferencias y a los repositorios de gastos, confirmaciones, pagos y métodos;
- agrupa los cambios con un retraso corto (~500 ms) y recalcula el plan;
- llama a `sync`, y lo hace también al abrir la app y al volver a primer plano (`AppState`), para que "hoy" se mueva.

Con permiso negado o todo apagado, `sync([])` deja el sistema limpio.

### 4. Preferencias en SQLite

Tabla `reminder_settings`, con una sola fila (`id = 'default'`):

| Columna | Por omisión |
|---|---|
| `charges_on` | `false` |
| `charges_time` | `'10:00'` |
| `daily_on` | `false` |
| `daily_time` | `'21:00'` |
| `idle_on` | `false` |
| `idle_days` | `3` |
| `idle_time` | `null`, que significa "usar la del diario" |
| `updated_at` | |

Se agrega una migración de Drizzle con la fila inicial. `ReminderSettingsRepository` ofrece `get()`, `update(patch)` y `subscribe`, y tiene versión en memoria y SQLite con pruebas de contrato. La validación es de dominio: horas `HH:MM` válidas e `idle_days` de 1 a 14.

### 5. Permisos

Al encender cualquier interruptor:

1. Se crea el canal.
2. Se consulta `getPermissionsAsync`. Si no está concedido y `canAskAgain`, se llama a `requestPermissionsAsync`.
3. Si al final no hay permiso, el interruptor no cambia y la pantalla pasa al estado "bloqueadas", con `Linking.openSettings()`.

Al abrir la pantalla se revisa el permiso. Si se revocó desde el sistema, se muestra el estado "bloqueadas" y no se agenda nada, sin apagar las preferencias. Así, al volver a dar el permiso, todo vuelve como estaba.

No se pide `SCHEDULE_EXACT_ALARM` ni `USE_EXACT_ALARM`.

### 6. Pantalla y navegación

- **Nueva ruta** `src/app/settings/notifications.tsx`, con su pantalla en `src/features/reminders/NotificationsScreen.tsx`, que sigue la maqueta: grupos "Cobros pendientes" y "Registrar gastos", `Switch` existente, filas de hora con `@react-native-community/datetimepicker` en modo hora (ya instalado), selector de días de 1 a 14, y la nota con el resultado del desuso.
- **Ajustes:** la fila "Notificaciones", con la campana sobre `frequency.quarterly` y el resumen, entre Categorías y Acceso directo.
- **Al tocar una notificación:** un listener de respuesta en el layout raíz navega según `data.target`.
  - `new-expense` va a `/expense/new?quick=1`.
  - `pending` abre el balance con la hoja; `BalanceScreen` acepta un parámetro `pending=1` que activa `forceSheet`.
  - Si la notificación abrió la app desde cero, el splash no se anima, igual que con el atajo: se extiende `shouldAnimateSplash` con la respuesta inicial de la notificación.

### 7. Configuración nativa

Se instala con `npx expo install expo-notifications` y se agrega el plugin en `app.json` con:

- `icon`: un ícono monocromo para la barra de estado. Se crea `assets/images/notification-icon.png` a partir del logo, en silueta blanca.
- `color`: `#328844`.
- `defaultChannel`: `reminders`.

Requiere un build nuevo; Expo Go no se usa.

## Risks / Trade-offs

- [Hora aproximada; Doze puede retrasar el aviso] → es aceptable para recordatorios, y se explica en la nota de la pantalla.
- [Más de 40 días con cobros en la ventana] → se agendan los 40 más cercanos. Cada apertura de la app mueve la ventana.
- [Fabricantes que cancelan alarmas de apps cerradas (algunos Xiaomi/Huawei)] → no está en nuestras manos. Se documenta en la guía de la beta si aparece.
- [Cambio de zona horaria] → `DATE` se calcula con la hora local al agendar, y al abrir la app se recalcula.
- [Pruebas de un módulo nativo] → `expo-notifications` se mockea en Jest. La lógica vive en el dominio y en el scheduler con dependencias inyectadas.

## Migration Plan

La migración agrega la tabla con la fila por omisión (todo apagado), así que no hay cambio para usuarios existentes. Se entrega en una beta con build nuevo. Para revertir, se regresa el commit; la tabla queda sin uso.
