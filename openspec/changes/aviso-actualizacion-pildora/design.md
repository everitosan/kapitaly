# Design

## Context

- `src/domain/appUpdate.ts` reduce los eventos de Play (`checked`, `progress`, `downloaded`, `canceled`, `dismissed`) a un `UpdateState` y `updateBanner(state)` decide qué mostrar.
- `useAppUpdate` (`src/features/updates/useAppUpdate.ts`) consulta al abrir y al volver, escucha el avance y expone `banner`, `update`, `restart` y `dismiss`.
- `BalanceScreen` monta `UpdateBanner` arriba del mes.
- La barra superior es `BalanceTopBar` en `src/ui/components/balance.tsx` (campana, Métodos de pago, Ajustes).
- `BalanceScreen` ya tiene dos `Modal pageSheet`: Pendientes (`sheetVisible`) y las listas de Análisis (`list`).

## Goals / Non-Goals

**Goals:**
- Que el aviso destaque sin ocupar la lista y sin competir con la hoja de Pendientes al abrir.
- Conservar el flujo nativo de Play y sus estados tal como están.

**Non-Goals:**
- Notas de la versión ("Qué hay de nuevo").
- Cambiar el módulo nativo o cuándo se consulta a Play.

## Decisions

### 1. Estado: sin `dismissed`, con `autoOpen`

- Se quitan `dismissed`, el evento `dismissed` y la regla de ocultar de `updateBanner`.
- `updateBanner` se renombra `updatePrompt`, con la misma forma: `available | downloading | downloaded`.
- `UpdateState` gana `autoOpen: boolean`:
  - el evento `downloaded` (que llega del listener de avance mientras la app está abierta) lo pone en `true`;
  - un `checked` con estado `downloaded` (al abrir o al volver) no lo toca;
  - un evento nuevo `autoOpened` lo regresa a `false`.

Así, "abrir sola una vez" queda en el reductor, que es puro y fácil de probar, y no depende de efectos en la pantalla.

**Alternativa descartada:** detectar en la pantalla el paso de `downloading` a `downloaded` con un `useRef`. Mezcla la regla con la UI y no distingue la consulta al volver de la app del aviso del listener.

### 2. Píldora en `BalanceTopBar`

`BalanceTopBar` recibe dos props opcionales, `update` (el prompt) y `onOpenUpdate`, y pinta `UpdatePill` antes de la campana con `marginRight: 'auto'`, para que quede a la izquierda.

- **Aspecto:** `DuotoneBlock` con el token nuevo `theme.update`, ícono ↑ en un círculo oscuro y tinta oscura en los dos temas.
- **Texto:** "Actualizar", "N %" o "Reiniciar".
- **Accesibilidad:** `accessibilityRole="button"` con etiqueta según el estado: "Nueva versión disponible, actualizar", "Descargando la nueva versión, N por ciento" o "Nueva versión lista, reiniciar".
- **Latido en "Reiniciar":** un `Animated.loop` de escala y opacidad del halo. No se anima si `AccessibilityInfo.isReduceMotionEnabled()` es verdadero.

### 3. Hoja propia, no `pageSheet`

`UpdateSheet` (`src/features/updates/UpdateSheet.tsx`) es un `Modal` con `transparent`, `animationType="slide"`, fondo oscuro tocable para cerrar y una tarjeta abajo con bordes de 34. Sigue la maqueta: bloque limón en una fila, con el ícono a la izquierda y a la derecha una columna con el título y el detalle o la barra de avance, para que el bloque sea bajo. Debajo van los botones.

`pageSheet` ocuparía toda la pantalla para tres líneas de texto.

### 4. Orquestación en `BalanceScreen`

- **Estado:** `updateOpen`. La píldora lo pone en `true`.
- **Apertura automática:** si `prompt?.kind === 'downloaded'` y `autoOpen`, se abre la hoja y se despacha `autoOpened`, siempre que no estén visibles Pendientes ni la lista de Análisis. Si alguna lo está, se despacha `autoOpened` igual, porque la spec dice que en ese caso no se abre.
- **Momento del ajuste:** se hace durante el render, como la selección de categoría, para respetar `react-hooks/set-state-in-effect`.
- **Visibilidad del `Modal`:** `updateOpen && prompt !== null && !sheetVisible && list === null`, para no apilar modales.
- **"Actualizar ahora":** cierra la hoja y luego llama a `update()`, para que la confirmación de Google no quede detrás.
- **Si el estado cambia con la hoja abierta**, la hoja muestra el nuevo. Si `prompt` pasa a `null`, se cierra.

### 5. Color

`theme.update` es un `Gradient` claro `#FFF27A → #FFD23F` y oscuro `#FFEE6B → #F5C52E`, con texto `#141414`. Se distingue del ámbar de `totals.average` (`#FFD45C → #FF9A3C`).

## Risks / Trade-offs

- [Barra estrecha en teléfonos pequeños con la píldora y la campana de pendientes activas] → La píldora usa textos cortos ("Actualizar", "45 %", "Reiniciar") y `numberOfLines={1}`. Se prueba en el teléfono a 360 dp.
- [Dos confirmaciones seguidas: la hoja y luego la de Google] → Se acepta. La de Google es obligatoria en el flujo flexible, y la nuestra solo aparece cuando el usuario toca la píldora.
- [Quitar la ✕ puede molestar a quien no quiere actualizar] → La píldora no tapa contenido, y en betas internas se espera que se actualice.

## Migration Plan

Solo JS: sale en la siguiente beta. Quien tenga la beta anterior verá todavía la tarjeta, y a partir de esta, la píldora.
