# Tasks

## 1. Estados (dominio puro)

- [x] 1.1 `src/domain/appUpdate.ts`: `UpdateState`, el reductor de eventos (check, progress, canceled, failed, dismissed) y `versionNameFromCode` con la fórmula de `scripts/beta-version.js`. Verificación: pruebas unitarias de las transiciones y de los nombres (beta, estable y código inválido).

## 2. Nativo

- [x] 2.1 Revisar la documentación de Play Core In-App Updates y agregar al módulo local `checkUpdate`, `startFlexibleUpdate`, `completeUpdate` y el evento `onUpdateProgress`, con la dependencia `com.google.android.play:app-update` fijada; agregar los tipos y envoltorios en `index.ts` (que devuelven `none` sin el módulo). Verificación: compilar el módulo con Gradle sobre un prebuild temporal y pruebas del envoltorio en JS (sin módulo nativo, `checkUpdate` responde que no hay actualización).

## 3. Hook y tarjeta

- [x] 3.1 `useAppUpdate()` (consulta al abrir y al volver, progreso, `update`, `restart`, `dismiss` y el respaldo a Play Store) y `UpdateBanner` en `BalanceScreen`. Verificación: pruebas con un doble del módulo de los escenarios del spec (hay versión nueva, al día, fuera de Play, descarga en curso, cancelar, lista para instalar, descarga terminada fuera de la app, ocultar y volver a abrir, y respaldo cuando el flujo falla).
- [x] 3.2 Ejecutar `npm test`, `npm run typecheck` y `npm run lint`. Verificación: los tres pasan.

## 4. Verificación en dispositivo

- [ ] 4.1 Instalar desde Play una beta que ya traiga esto, publicar la siguiente y abrir la app: aparece el aviso, "Actualizar" descarga en segundo plano, "Reiniciar" instala y la app abre en la versión nueva. Verificación: lo confirma el usuario.
