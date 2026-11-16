# Tasks

## 1. Maqueta

- [ ] 1.1 Revisar con el usuario el teléfono "C + B" de `design/propose/aviso-actualizacion-v2.html` en los tres estados y los dos temas (píldora a la izquierda de la campana, hoja sin "Qué hay de nuevo") y ajustar lo que pida antes de implementar. Verificación: el usuario aprueba la maqueta.

## 2. Dominio

- [ ] 2.1 En `src/domain/appUpdate.ts`, quitar `dismissed` y el evento `dismissed`, renombrar `updateBanner`/`UpdateBanner` a `updatePrompt`/`UpdatePrompt` y agregar `autoOpen`: `true` con el evento `downloaded`, sin cambios con `checked` (incluso si responde `downloaded`) y `false` con el evento nuevo `autoOpened`. Verificación: `src/domain/__tests__/appUpdate.test.ts` actualizado; se quitan los casos de la ✕ y se agregan: `downloaded` → `autoOpen` verdadero; `checked` con `downloaded` → falso; `autoOpened` → falso; `canceled` no lo enciende. `npm test` pasa.
- [ ] 2.2 En `src/features/updates/useAppUpdate.ts`, exponer `prompt`, `autoOpen`, `update`, `restart` y `markAutoOpened`, y quitar `dismiss`. Verificación: `useAppUpdate.test.tsx` actualizado: el caso de la ✕ se reemplaza por "termina la descarga con la app abierta → `autoOpen`" y "abre con la descarga ya terminada → sin `autoOpen`"; los demás casos siguen pasando con `prompt` en lugar de `banner`.

## 3. UI

- [ ] 3.1 Agregar el token `update: Gradient` a `src/ui/theme.ts` (claro `#FFF27A → #FFD23F`, oscuro `#FFEE6B → #F5C52E`, texto `#141414`) y a su tipo. Verificación: `src/ui/__tests__/theme.test.ts` comprueba que existe en los dos temas y que el texto tiene contraste ≥ 4.5:1 sobre los dos colores.
- [ ] 3.2 Crear `UpdatePill` y agregarla a `BalanceTopBar` (`src/ui/components/balance.tsx`) con las props opcionales `update` y `onOpenUpdate`, antes de la campana y alineada a la izquierda. Debe mostrar "Actualizar", "N %" o "Reiniciar" con la etiqueta accesible de cada estado, y en "Reiniciar" un latido que se apaga si está activada la reducción de movimiento. Verificación: pruebas en `src/ui/components/__tests__/components.test.tsx`: sin `update` no hay píldora; los tres textos y etiquetas; tocarla llama `onOpenUpdate`; con reducción de movimiento no inicia la animación.
- [ ] 3.3 Crear `src/features/updates/UpdateSheet.tsx` (`Modal` transparente, fondo tocable para cerrar, tarjeta inferior) con el contenido de cada estado: disponible ("Nueva versión disponible", versión, "Actualizar ahora", "Más tarde"), descargando (avance con barra, "Seguir usando la app") y lista ("Lista para instalar", "Reiniciar ahora", "Después"). Borrar `UpdateBanner.tsx`. Verificación: pruebas nuevas en `src/features/updates/__tests__/UpdateSheet.test.tsx` con los tres estados; cada botón llama a su acción (`onUpdate`, `onRestart` u `onClose`).

## 4. Pantalla

- [ ] 4.1 En `src/features/balance/BalanceScreen.tsx`, quitar la tarjeta, pasar `update`/`onOpenUpdate` a `BalanceTopBar` y montar `UpdateSheet` con `visible = updateOpen && prompt !== null && !sheetVisible && list === null`. "Actualizar ahora" cierra la hoja y luego llama `update()`. Con `autoOpen`, abrir la hoja si no están visibles Pendientes ni la lista de Análisis, y en cualquier caso llamar `markAutoOpened()` (ajuste durante el render, sin `setState` en efectos). Verificación: pruebas en `BalanceScreen.test.tsx` con el módulo de Play simulado: píldora visible y sin tarjeta arriba del mes; tocar la píldora abre la hoja; "Más tarde" la cierra y la píldora sigue; "Actualizar ahora" cierra la hoja y llama `startFlexibleUpdate`; terminar la descarga con la app abierta abre la hoja una vez y "Después" no la vuelve a abrir; con Pendientes abierto no se abre sola.

## 5. Verificación integral

- [ ] 5.1 Correr `npm run lint`, `npm run typecheck`, `npm test` y `npx prettier --check` sobre los archivos cambiados, y `grep -rn "UpdateBanner\|dismissed" src` sin resultados del aviso. Verificación: todo pasa.
- [ ] 5.2 Probar en el teléfono con dos betas seguidas desde la pista interna de Play, en claro y oscuro y a 360 dp: aparece la píldora; la hoja se abre al tocarla; "Actualizar ahora" lleva a la confirmación de Google; la píldora muestra el avance; al terminar se abre la hoja sola una vez; "Reiniciar ahora" instala. TalkBack anuncia la píldora. Verificación: la beta nueva queda instalada y conserva los datos.

## Workflow follow-up

- Hacer commit de la propuesta con la maqueta ("docs: propuesta y maqueta de la píldora de actualización") antes del commit de la implementación, siguiendo el skill `flujo-ramas`.
- Agregar las notas de la beta en `release-notes/<versionName>/whatsnew-en-US`.
- Archivar con `/opsx:archive` para actualizar la spec `app-updates`.
