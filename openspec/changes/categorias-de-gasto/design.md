# Design

## Context

- Los métodos de pago ya resuelven casi todo lo que necesitan las categorías: una fila sembrada por migración con id fijo ("Efectivo", migración 0001), archivado con `archivedAt`, borrado lógico con `deletedAt`, repositorios SQLite y en memoria que cumplen un contrato compartido (`src/data/repositories/contract.ts`), y una regla de lint que mantiene `src/domain` puro.
- El acceso a métodos de pago es un `RoundButton` con `CardIcon` dentro de `MonthSwitcher` (`src/ui/components/balance.tsx`), y `src/app/index.tsx` le pasa `onOpenMethods`. El enlace de desarrollo vive en el `footer` del balance en `src/app/index.tsx`.
- Las filas del balance se arman con `ExpenseRow` desde `BalanceScreen.chargeRow`. El color del bloque depende de la frecuencia (`theme.frequency`).
- Los íconos actuales son SVG propios dibujados con `react-native-svg`, que ya es dependencia.
- `src/app/dev/components.tsx` era una pantalla de desarrollo enlazada solo con `__DEV__`, pero incluida en el bundle de producción.
- La última migración es la 0004 (`adds_to_card_balance`).

## Goals / Non-Goals

**Goals:**
- Reutilizar el patrón de métodos de pago (semilla, ocultar, borrado lógico, contrato de repositorio) en lugar de inventar uno nuevo.
- Guardar en los gastos solo una referencia estable (`category_id`) y en la categoría solo una clave de ícono, para que la suite pueda leerlas sin depender de la UI.

**Non-Goals:**
- Ordenar las categorías a mano ni agruparlas.
- Sincronización: los metadatos quedan listos, pero no hay sync en esta versión.

## Decisions

**1. Tabla `categories` con semilla en migración.**
Columnas: meta común (`id`, `created_at`, `updated_at`, `deleted_at`), `name`, `icon` (clave del set), `builtin` (boolean), `hidden_at`. La migración 0005 inserta las 8 categorías de inicio con ids fijos legibles (`otro`, `hogar`, `comida`, `transporte`, `servicios`, `suscripciones`, `salud`, `entretenimiento`), igual que "Efectivo".
- *Alternativa:* catálogo en código de solo lectura, como las instituciones. Se descarta porque las de inicio tienen estado del usuario (oculta, ícono) y conviven con las personalizadas en la misma lista.

**2. `category_id` obligatorio en los gastos, sin FOREIGN KEY.**
Se agrega `category_id TEXT NOT NULL DEFAULT 'otro'` a `recurring_expenses` y `one_off_expenses`. El default cubre las filas existentes en el mismo `ALTER`. Sin FK, por la misma convención del esquema: un registro sincronizado puede llegar antes que su categoría. Si la migración generada por drizzle-kit no admite el default con el `NOT NULL`, se escribe a mano el SQL.
- Las confirmaciones de cobro no guardan categoría: se resuelve siempre con la del gasto (spec `recurring-expenses`).

**3. Resolver la categoría en el dominio con un "Otro" de respaldo.**
Una función pura `resolveCategory(id, categories)` devuelve la categoría vigente con ese id, o "Otro" si no existe o está eliminada. Una categoría oculta se sigue resolviendo (spec `expense-categories`). El balance y el formulario usan esta función; ningún componente decide por su cuenta.
- *Alternativa:* reescribir `category_id` a `otro` al borrar. Se descarta porque cambia `updated_at` de gastos que el usuario no tocó y complica la sincronización.

**4. Reglas de edición en el dominio.**
`validateCategoryInput` (nombre obligatorio, sin repetir ignorando mayúsculas y acentos entre categorías vigentes, ícono del set) y funciones `canRename`, `canHide`, `canRemove`, `canChangeIcon` según `builtin` y el id `otro`. El repositorio las aplica igual que `canArchive` y `canRemove` en métodos de pago.

**5. Set de íconos propio.**
`src/ui/icons/categoryIcons.tsx` exporta un mapa `clave -> trazos SVG` (24×24, trazo redondeado) con unos 24 íconos: los 8 predeterminados y unos 16 más para las personalizadas. Los trazos se copian de Lucide y se agrega su licencia ISC en `src/ui/icons/LICENSE-lucide`. Un componente `CategoryIcon` dibuja la clave con el color de tinta del tema; una clave desconocida dibuja el ícono de "Otro". La lista de claves válidas se define en el dominio (`CATEGORY_ICON_KEYS`) para que la validación no dependa de la UI.
- *Alternativas:* `expo-symbols` (SF Symbols en iOS y Material en Android, se ven distintos) y emojis (dependen de la plataforma). Se descartan por la consistencia entre plataformas.

**6. Navegación.**
Nuevas rutas: `src/app/settings/index.tsx` (Ajustes), `src/app/categories/index.tsx` (lista) y `src/app/categories/[id].tsx` (crear/editar, modal, `id = "new"` para alta). `MonthSwitcher` cambia `onMethods` por `onMenu` con un `MenuIcon`. Se borra `src/app/dev/components.tsx` y su enlace: Expo Router registra todo archivo de `src/app` como ruta, así que la pantalla llegaba al bundle de producción (verificado con `expo export`) aunque el enlace se eliminara con `__DEV__`. El catálogo visual queda en la maqueta HTML.

**7. Formulario de gasto.**
Una fila `CategoryField` (ícono + nombre + chevron) abre una hoja con la cuadrícula de categorías vigentes y no ocultas. El draft del formulario usa `otro` por defecto. Al editar un gasto cuya categoría está oculta, la fila la muestra y el selector la incluye marcada para no cambiarla en silencio.

**8. Fila del balance.**
`ExpenseRow` recibe `category` y muestra el ícono pequeño junto al título, con el nombre de la categoría en la línea secundaria, antes del método. La maqueta define el acomodo final.

## Risks / Trade-offs

- [La línea secundaria de la fila se alarga y se corta en pantallas angostas] → La maqueta lo valida a 360 px; se trunca el método antes que la categoría.
- [Un nombre personalizado choca con uno de inicio oculto] → La regla de nombre repetido considera todas las categorías no eliminadas, incluidas las ocultas.
- [Borrar una categoría con muchos gastos los manda a "Otro" sin aviso] → La confirmación de borrado indica cuántos gastos pasarán a "Otro".
- [Cambiar la categoría de un recurrente reclasifica su historial] → Es el comportamiento acordado (spec `recurring-expenses`); categorías por cobro quedan fuera de alcance.

## Migration Plan

1. La migración 0005 crea `categories`, inserta las 8 de inicio y agrega `category_id` con default `otro` a los dos tipos de gasto. Se verifica con las pruebas de repositorio SQLite (better-sqlite3), que corren todas las migraciones.
2. Se publica como `v0.1.0-beta.3`. Al actualizar desde Play, los gastos de la beta.2 quedan en "Otro".
3. No hay rollback de esquema: una beta anterior no podría abrir la base migrada. Si hay un problema, se corrige con una beta nueva.
