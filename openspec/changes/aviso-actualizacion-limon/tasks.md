# Tasks

## 1. Maqueta

- [x] 1.1 Revisar con el usuario el teléfono "A · Bloque limón" de `design/propose/aviso-actualizacion-v2.html` en los tres estados y los dos temas. Verificación: el usuario aprueba la maqueta. El texto de "descargando" en la app sigue siendo "Descargando la nueva versión… N %".

## 2. Tema

- [x] 2.1 Agregar `update: Gradient` al tipo `Theme` y a los dos temas de `src/ui/theme.ts` (claro `#FFF27A → #FFD23F`, oscuro `#FFEE6B → #F5C52E`, texto `ON_BLOCK`). Verificación: `src/ui/__tests__/theme.test.ts` comprueba que existe en los dos temas y que el texto tiene contraste ≥ 4.5:1 sobre `from` y `to`.

## 3. Tarjeta

- [x] 3.1 En `src/features/updates/UpdateBanner.tsx`, pasar el contenedor a `DuotoneBlock` con `theme.update` y agregar el ícono ↑ decorativo (oculto al lector de pantalla), el botón negro con texto `update.from`, la ✕ con `update.text` y, en `downloading`, la barra de avance con `accessibilityRole="progressbar"` y `accessibilityValue`. Verificación: las pruebas actuales de `src/features/updates/__tests__/useAppUpdate.test.tsx` pasan sin cambiar sus aserciones. Agregar casos: en "descargando" hay una barra con `now: 45`; en "disponible" y "lista" no hay barra.

## 4. Verificación integral

- [x] 4.1 Correr `npm run lint`, `npm run typecheck`, `npm test` y `npx prettier --check` sobre los archivos cambiados. Verificación: todo pasa.
- [ ] 4.2 Probar en el teléfono, en claro y oscuro, con una beta nueva disponible en la pista interna. Verificación: el aviso se ve limón con el ícono; la barra avanza al descargar; "Reiniciar" instala; la ✕ oculta el aviso en esa apertura.

## Workflow follow-up

- Hacer commit de la propuesta con la maqueta ("docs: propuesta y maqueta del aviso de actualización limón") antes de la implementación, siguiendo el skill `flujo-ramas`.
- Archivar con `/opsx:archive`; no actualiza specs (`skip_specs`).
