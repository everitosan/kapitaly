# Design

## Context

- La ruta `src/app/expense/new.tsx` ya abre el formulario y el esquema de la app es `kapitalyexpenses` (`app.json`), así que `kapitalyexpenses://expense/new` es un enlace profundo válido de Expo Router.
- El layout raíz (`src/app/_layout.tsx`) es un `Stack` sin `unstable_settings`: al entrar por enlace profundo con la app cerrada, el formulario quedaría solo en la pila y `router.back()` no tendría a dónde volver.
- `BalanceScreen` abre la hoja de Pendientes automáticamente una vez por sesión (`pendingSession.autoDismissed`) en cuanto hay pendientes, sin considerar si el balance está visible.
- El proyecto no tiene código nativo propio. `android/` se genera con prebuild; la configuración nativa vive en `app.json` y en plugins de `plugins/` (ya existe `withAndroidReleaseSigning.js`). `minSdk` es 24 (plantilla de RN 0.88).
- Expo SDK 58 no incluye una API para fijar accesos directos; `expo-quick-actions` no es oficial ni soporta atajos estáticos de Android.

## Goals / Non-Goals

**Goals:**
- Un solo destino (`kapitalyexpenses://expense/new?quick=1`) para el acceso directo fijado y el atajo estático, resuelto por Expo Router sin manejar intents a mano.
- Código nativo mínimo, aislado en un módulo local que en cualquier plataforma sin soporte responde "no disponible" en vez de fallar.

**Non-Goals:**
- Accesos directos dinámicos que cambien con el uso.
- Íconos de acceso directo con el color de un método o categoría.

## Decisions

**1. Módulo local `kapitaly-shortcuts` con Expo Modules API.**
Se crea con `npx create-expo-module@latest --local` en `modules/kapitaly-shortcuts` (autoenlazado). API JS:
- `isPinSupported(): boolean` → `ShortcutManagerCompat.isRequestPinShortcutSupported(context)`.
- `requestPinNewExpense(): Promise<boolean>` → construye un `ShortcutInfoCompat` con id `new-expense`, etiqueta corta "Nuevo gasto", ícono `@drawable/shortcut_new_expense` e `Intent(ACTION_VIEW, "kapitalyexpenses://expense/new?quick=1")` dirigido al paquete de la app, y llama a `requestPinShortcut`. Devuelve si el sistema aceptó mostrar la confirmación (no si el usuario confirmó: Android no lo informa sin un callback, que no hace falta aquí).
En iOS y web el módulo exporta las mismas funciones devolviendo `false`, y en Expo Go el import se envuelve con `requireOptionalNativeModule` para que la opción simplemente no aparezca.
- *Alternativas:* `expo-quick-actions` (no oficial, sin atajos estáticos en Android) y arrastrar el atajo del ícono (requiere presión larga). Se descartan.
- `ShortcutManagerCompat` viene de `androidx.core`, que ya está en el proyecto generado; no se agregan dependencias.

**2. Atajo estático con un plugin de configuración.**
`plugins/withAndroidShortcuts.js` (con `withDangerousMod` y `withAndroidManifest`):
- escribe `res/xml/shortcuts.xml` con el atajo `new-expense` (mismo intent y etiqueta),
- escribe el ícono `res/drawable/shortcut_new_expense.xml` (vector: "+" en tinta sobre círculo lima del estilo Duotono),
- agrega `<meta-data android:name="android.app.shortcuts" android:resource="@xml/shortcuts"/>` a la actividad principal.
El módulo nativo reutiliza el mismo drawable para el acceso directo fijado. Se prueba con pruebas unitarias del plugin, como el de firma.

**3. Pila con el balance debajo.**
`export const unstable_settings = { anchor: 'index' }` en `src/app/_layout.tsx`. Al entrar por enlace profundo con la app cerrada, Expo Router monta el balance debajo del formulario, y "Guardar"/"Cancelar" (que hacen `router.back()`) regresan al balance. Con la app abierta, el enlace empuja el formulario encima de la pantalla actual.

**4. Modo de captura rápida en el formulario.**
`src/app/expense/new.tsx` lee `quick` con `useLocalSearchParams` y pasa `autoFocusAmount` a `ExpenseForm`, que lo propaga a `AmountBlock` (`autoFocus` en el `TextInput` del monto). El tipo ya empieza en "Único". El botón "Agregar gasto" del balance no usa el modo rápido, para no abrir el teclado sin que se pida.

**5. Hoja de Pendientes solo con el balance visible.**
`BalanceScreen` usa `useIsFocused` (React Navigation, expuesto por Expo Router) y solo abre la hoja automática cuando el balance está enfocado. Si la app arranca en el formulario, la hoja aparece al volver al balance, una vez por sesión como hoy. `BalanceScreen` recibe `focused` como prop desde la ruta, para que sus pruebas no dependan del navegador.

**6. Ajustes.**
`SettingsScreen` muestra la fila "Acceso directo: nuevo gasto" (ícono "+" sobre lima) solo si `isPinSupported()`; al tocarla llama a `requestPinNewExpense()`. Si el sistema rechaza mostrar la confirmación, muestra un aviso breve ("Tu pantalla de inicio no permite agregar accesos directos").

## Risks / Trade-offs

- [Algunos launchers no admiten fijar accesos directos] → La opción se oculta según `isPinSupported()`; queda el atajo del ícono.
- [El código nativo solo se prueba en un build real] → El plugin tiene pruebas unitarias; el módulo se verifica en el build de CI (compila con Gradle) y a mano en un development build o la beta. Las pruebas de JS simulan el módulo.
- [`unstable_settings` está marcado como inestable] → Es la forma documentada en SDK 58; la prueba manual de "app cerrada → guardar → balance" lo cubre en cada beta.
- [Un acceso directo fijado queda en el escritorio aunque cambie su destino] → Se usa un id fijo (`new-expense`) y una ruta estable; si se renombra, `updateShortcuts` lo actualiza.

## Migration Plan

1. Prebuild genera el atajo, el ícono y el módulo; el workflow de beta ya corre `expo prebuild` y Gradle, así que no cambia.
2. Se publica en `v0.1.0-beta.3`. En la app ya instalada, el atajo del ícono aparece al actualizar y el acceso directo fijado se agrega desde Ajustes.
3. Rollback: una beta sin el plugin elimina el atajo estático; los accesos directos ya fijados se deshabilitan solos si el id deja de existir.
