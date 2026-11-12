# Tasks

## 1. Maqueta

- [x] 1.1 Maquetar en `design/propose/a-1-duotono.html`, con los tokens existentes y en claro y oscuro: encabezado del balance con botón de menú, pantalla Ajustes, pantalla Categorías (de inicio, ocultas, personalizadas y "Otro" fija), hoja de crear/editar categoría con la cuadrícula de íconos, fila "Categoría" del formulario y su selector, y filas de "Este mes" y "Promedio" con categoría. Verificar a 360 px de ancho y obtener la aprobación del usuario antes de seguir.

## 2. Datos y dominio

- [x] 2.1 Agregar `CATEGORY_ICON_KEYS`, la entidad `Category`, `validateCategoryInput` (nombre obligatorio y sin repetir ignorando mayúsculas y acentos, ícono válido), las reglas `canRename`/`canHide`/`canRemove`/`canChangeIcon` y `resolveCategory` con respaldo a "Otro" en `src/domain`; verificar con pruebas unitarias que cubran los escenarios de `expense-categories`.
- [x] 2.2 Agregar `categoryId` a gastos recurrentes y únicos (entidad, input y validación, con `otro` por defecto) y ajustar las pruebas de dominio existentes; verificar con `npm test` y `npm run typecheck`.
- [x] 2.3 Agregar la tabla `categories` y la columna `category_id` al esquema; generar la migración 0005 con la semilla de las 8 categorías y el default `otro` (ajustando el SQL a mano si drizzle-kit no lo genera bien); verificar con una prueba SQLite que una base con datos de la 0004 migra con todos los gastos en `otro`.
- [x] 2.4 Implementar el repositorio de categorías en SQLite y en memoria (listar, crear, actualizar, ocultar, mostrar, borrar lógico, aplicando las reglas del dominio) y agregar su contrato en `contract.ts`; mapear `categoryId` en los repositorios de gastos; verificar con las pruebas de contrato en ambas implementaciones.

## 3. Íconos

- [ ] 3.1 Crear `src/ui/icons/categoryIcons.tsx` con unos 24 íconos (trazos de Lucide) para todas las claves de `CATEGORY_ICON_KEYS`, el componente `CategoryIcon` con respaldo al ícono de "Otro" y `src/ui/icons/LICENSE-lucide`; verificar con una prueba que toda clave del dominio tiene ícono.

## 4. Ajustes y Categorías

- [ ] 4.1 Cambiar el botón de métodos de pago de `MonthSwitcher` por un botón de menú y crear la ruta y pantalla Ajustes con "Métodos de pago" y "Categorías" (con sus conteos); verificar con pruebas de UI la navegación y que Ajustes solo muestra esas dos opciones.
- [x] 4.2 Borrar la pantalla de desarrollo `src/app/dev/components.tsx` y su enlace del balance; verificar con `npx expo export --platform android` que el bundle ya no contiene sus textos.
- [ ] 4.3 Crear la pantalla Categorías y la hoja de crear/editar con la cuadrícula de íconos, aplicando las reglas de "Otro", de las de inicio y de las personalizadas, con confirmación de borrado que indique cuántos gastos pasarán a "Otro"; verificar con pruebas de UI los escenarios de `expense-categories`.

## 5. Formulario y balance

- [ ] 5.1 Agregar la fila "Categoría" y su selector al formulario de gasto (solo categorías vigentes y no ocultas, "Otro" por defecto, conservando una categoría oculta al editar); verificar con pruebas de UI los escenarios de alta en `one-off-expenses` y `recurring-expenses`.
- [ ] 5.2 Mostrar ícono y nombre de la categoría en las filas de "Este mes" y "Promedio", resolviendo categorías borradas como "Otro"; verificar con pruebas de UI los escenarios de `monthly-balance`.

## 6. Verificación integrada

- [ ] 6.1 Correr `npm test`, `npm run typecheck`, `npm run lint` y `openspec validate categorias-de-gasto --strict`, y revisar en Expo que el flujo completo (crear categoría, usarla en un gasto, verla en el balance, borrarla y ver el gasto en "Otro") funciona en claro y oscuro.
- [ ] 6.2 Publicar `v0.1.0-beta.3` desde `release/0.1.0` y verificar, al actualizar desde Play, que los gastos de la beta.2 quedan en "Otro" y conservan sus datos.

## Workflow follow-up

- Archivar el cambio y sincronizar los specs cuando la beta.3 esté verificada.
