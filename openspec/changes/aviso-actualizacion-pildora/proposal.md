# Proposal

> **En pausa (2026-11-16).** Se eligió la opción A (`aviso-actualizacion-limon`). Este cambio se retoma cuando haya infraestructura para mostrar las novedades de cada versión en la hoja; sin ellas, la hoja no aporta lo suficiente. No aplicar ni archivar mientras tanto.

## Why

El aviso de actualización es una tarjeta blanca igual a las demás del balance y pasa desapercibido, así que quienes prueban la beta tardan en actualizar o se quedan con la descarga a medias. La maqueta `design/propose/aviso-actualizacion-v2.html` comparó cinco opciones y se eligió "C + B": una píldora llamativa en la barra superior que abre una hoja.

## What Changes

- La tarjeta de arriba del mes desaparece. En su lugar, la barra superior del balance muestra una **píldora amarillo limón** con un ícono ↑, a la izquierda de la campana, según el estado:
  - disponible: "Actualizar";
  - descargando: el avance, "45 %";
  - lista: "Reiniciar", con un latido suave.
- **Tocar la píldora abre una hoja** con el estado actual:
  - disponible: bloque limón con "Nueva versión disponible" y la versión, más "Actualizar ahora" y "Más tarde";
  - descargando: el avance con su barra y "Seguir usando la app";
  - lista: "Lista para instalar", más "Reiniciar ahora" y "Después".
- "Actualizar ahora" cierra la hoja y abre la confirmación de Google, igual que hoy el botón "Actualizar".
- **La hoja se abre sola una sola vez**: cuando la descarga termina con la app abierta. En los demás casos solo se abre al tocar la píldora.
- **BREAKING (spec):** se quita la ✕ para ocultar el aviso. La píldora no ocupa la lista y "Más tarde" solo cierra la hoja.
- La hoja no lleva "Qué hay de nuevo": la app no tiene de dónde sacar las notas de la versión nueva.
- Sin cambios: cuándo se consulta a Play, el respaldo con Play Store, que fuera de Play no aparezca nada y que "Lista para instalar" no se pueda ocultar.

**Decisiones tomadas por omisión** (el usuario puede cambiarlas): sin "Qué hay de nuevo" y apertura automática solo al terminar la descarga.

## Capabilities

### New Capabilities
<!-- Ninguna -->

### Modified Capabilities
- `app-updates`: el aviso pasa de tarjeta a píldora en la barra con hoja; se quita "Ocultar el aviso" y se agregan la hoja y su apertura automática al terminar la descarga.

## Impact

- **Dominio:** `src/domain/appUpdate.ts`: se quitan `dismissed` y el evento `dismissed`; se agrega la detección de "terminó la descarga en esta sesión" para abrir la hoja una vez.
- **UI:** `UpdateBanner.tsx` se reemplaza por `UpdatePill` (en `BalanceTopBar`) y `UpdateSheet`. Token de color limón en `src/ui/theme.ts`.
- **Pantalla:** `BalanceScreen.tsx` monta la píldora y la hoja y evita abrirla sola si la hoja de Pendientes está visible.
- **Pruebas:** `appUpdate.test.ts`, `useAppUpdate.test.tsx` y pruebas nuevas de píldora y hoja.
- **Nativo:** sin cambios; usa el mismo módulo de Play. Solo JS.
