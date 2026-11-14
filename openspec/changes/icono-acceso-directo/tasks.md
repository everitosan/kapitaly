# Tasks

## 1. Geometría compartida

- [x] 1.1 Crear `src/ui/shortcutIconArt.ts` con la geometría del ícono (lienzo de 108, radios 33, 27 y 20.5, colores, degradado y `pathData` de la cartera) según la maqueta. Verificación: prueba de que los círculos y la cartera caben en la zona segura (radio 33 alrededor de 54, 54).

## 2. Recursos nativos

- [x] 2.1 En `plugins/withAndroidShortcuts.js`, generar `shortcut_new_expense_background.xml`, `shortcut_new_expense_foreground.xml`, `drawable-anydpi-v26/shortcut_new_expense.xml` (adaptive-icon) y el respaldo `drawable/shortcut_new_expense.xml` (vector recortado al área visible), sin cambiar el nombre del recurso. Verificación: pruebas del plugin con el contenido de cada archivo (capas, `#020903`, degradado `#328844` → `#063D12`, cartera) y otra que compruebe que la geometría coincide con `shortcutIconArt.ts`. Además, `npx expo prebuild --platform android --no-install` en una copia temporal genera los archivos y `aapt2`/Gradle los compila (`./gradlew :app:mergeReleaseResources` o equivalente).

## 3. Ajustes

- [x] 3.1 Componente `ShortcutIcon` en `src/ui/icons/` y su uso en la fila "Acceso directo: nuevo gasto" de `SettingsScreen`. Verificación: prueba de componente de que la fila muestra el ícono, y que las pruebas de Ajustes siguen pasando.

## 4. Cierre

- [x] 4.1 Ejecutar `npm test`, `npm run typecheck` y `npm run lint`. Verificación: los tres pasan.
- [ ] 4.2 Probar en el teléfono con la beta: el acceso directo fijado (quitándolo y volviendo a fijarlo si ya existía) y el atajo al mantener presionado muestran el ícono nuevo, no negro. Verificación: lo confirma el usuario.
