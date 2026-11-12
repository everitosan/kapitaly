# Tasks

## 1. Maqueta

- [x] 1.1 Maquetar en `design/propose/a-1-duotono.html` el ícono del acceso directo ("+" sobre lima) en una pantalla de inicio de Android, la fila "Acceso directo: nuevo gasto" en Ajustes y el formulario abierto en modo rápido (cursor en el monto, teclado visible), en claro y oscuro; obtener la aprobación del usuario antes de seguir.

## 2. Navegación y formulario

- [x] 2.1 Agregar `unstable_settings = { anchor: 'index' }` al layout raíz y el modo rápido en `/expense/new?quick=1` (enfoca el monto en `AmountBlock`); verificar con pruebas de UI que con `quick` el monto tiene foco y sin él no.
- [x] 2.2 Abrir la hoja automática de Pendientes solo con el balance enfocado (prop `focused` desde la ruta); verificar con pruebas de UI que no se abre sin foco y que aparece al recuperarlo, una vez por sesión.

## 3. Código nativo

- [x] 3.1 Crear `plugins/withAndroidShortcuts.js` (shortcuts.xml, drawable vectorial y meta-data en la actividad principal) y registrarlo en `app.json`; verificar con pruebas unitarias del plugin y con `npx expo prebuild --platform android --no-install` en el scratchpad que los archivos generados son correctos, sin versionar `android/`.
- [x] 3.2 Crear el módulo local `modules/kapitaly-shortcuts` con `create-expo-module --local` (Kotlin con `ShortcutManagerCompat`; iOS y web devuelven `false`) y su wrapper JS con `requireOptionalNativeModule`; verificar que compila con `./gradlew :app:compileReleaseKotlin` en el proyecto generado y que el wrapper responde "no disponible" en pruebas de Jest.

## 4. Ajustes

- [x] 4.1 Mostrar "Acceso directo: nuevo gasto" en Ajustes solo si `isPinSupported()`, con aviso si el sistema rechaza la petición; verificar con pruebas de UI (módulo simulado) los escenarios de `settings-menu` y de `quick-add-shortcut`.

## 5. Verificación integrada

- [x] 5.1 Correr `npm test`, `npm run typecheck`, `npm run lint` y `openspec validate acceso-rapido-nuevo-gasto --strict`.
- [ ] 5.2 Publicar `v0.1.0-beta.3` y verificar en el teléfono: agregar el acceso directo desde Ajustes, abrir la app cerrada desde el ícono (formulario en "Único" con el teclado en el monto, guardar y volver al balance, Pendientes sin interrumpir), el atajo al mantener presionado el ícono, y que los gastos de la beta.2 quedan en "Otro" (pendiente de `categorias-de-gasto`).

## Workflow follow-up

- Archivar el cambio y sincronizar los specs cuando la beta.3 esté verificada.
