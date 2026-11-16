# Design

## Context

`UpdateBanner` (`src/features/updates/UpdateBanner.tsx`) es un `View` con `colors.card`, título, detalle, un botón con `primary.to` y la ✕. Lo monta `BalanceScreen` arriba del mes. Los bloques de color de la app usan `DuotoneBlock` con un `Gradient` del tema (`src/ui/theme.ts`, helper `g(from, to, text = ON_BLOCK)`).

## Goals / Non-Goals

**Goals:**
- Que el aviso se lea como un bloque de color, con la misma estructura y los mismos textos y acciones.

**Non-Goals:**
- Cambiar la lógica de `useAppUpdate` o de `src/domain/appUpdate.ts`.
- Animaciones.

## Decisions

### 1. Token `update` en el tema

`Theme` gana `update: Gradient`: claro `g('#FFF27A', '#FFD23F')`, oscuro `g('#FFEE6B', '#F5C52E')`, con el texto `ON_BLOCK` (`#141414`) en ambos, igual que los otros bloques. Se distingue del ámbar de `totals.average` (`#FFD45C → #FF9A3C`).

**Alternativa descartada:** reutilizar `totals.average`. Haría que el aviso pareciera parte del balance.

### 2. Tarjeta sobre `DuotoneBlock`

El contenedor pasa a `DuotoneBlock gradient={theme.update} radius={22}` y conserva `testID="update-banner"`:

- **Ícono:** a la izquierda, una flecha ↑ (SVG) de 40 px en un círculo `#141414` con trazo del color `update.from`. Se oculta al lector de pantalla porque es decorativo.
- **Botón:** fondo `#141414` y texto `update.from`.
- **✕:** usa `update.text` con opacidad.
- **Barra de avance:** solo en `downloading`, de 6 px bajo el título. El riel es `rgba(20,20,20,.15)` y el relleno `#141414`, con un ancho de `percent %`. Lleva `accessibilityRole="progressbar"` y `accessibilityValue={{ min: 0, max: 100, now: percent }}`.

Los textos siguen exactamente iguales ("Nueva versión disponible", "Descargando la nueva versión… N %", "Lista para instalar"), así que las pruebas actuales no cambian.

## Risks / Trade-offs

- [Contraste del texto oscuro sobre el limón] → El texto `#141414` sobre `#FFD23F` y `#F5C52E` supera 10:1. Se comprueba en `theme.test.ts`.
- [Un bloque amarillo arriba del mes puede competir con el total de "Tus gastos"] → Es intencional mientras haya una versión pendiente, y la ✕ lo oculta en esa apertura.
