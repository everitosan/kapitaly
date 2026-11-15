# Tasks

## 1. Datos

- [x] 1.1 Dominio `src/domain/uiPreferences.ts` (`BALANCE_SORT_KEY`, `DEFAULT_BALANCE_SORT`, `parseBalanceSort`) y tabla `ui_preferences` con migración, y `UiPreferencesRepository` (`get`, `set`, `subscribe`) en memoria y SQLite. Verificación: pruebas unitarias de `parseBalanceSort` (válido, ausente, inválido), pruebas de contrato en las dos versiones y prueba de actualización de base (`upgrade.test.ts`).

## 2. Pantalla

- [x] 2.1 Hook `useBalanceSort()` y su uso en `BalanceScreen`: leer el orden guardado al abrir, guardarlo al tocar el botón y no dibujar la lista hasta tenerlo. Verificación: pruebas de los escenarios "Orden conservado al volver a abrir la app" (desmontar y volver a montar con los mismos repositorios) y "Sin orden elegido"; las pruebas existentes del orden siguen pasando.
- [x] 2.2 Ejecutar `npm test`, `npm run typecheck` y `npm run lint`. Verificación: los tres pasan.

## 3. Verificación en dispositivo

- [x] 3.1 En la beta: cambiar a "Más reciente", cerrar la app y volver a abrirla; la lista sigue en "Más reciente". Verificación: lo confirma el usuario.
