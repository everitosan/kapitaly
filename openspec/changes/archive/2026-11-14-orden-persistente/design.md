# Design

## Context

Ver `proposal.md` y el delta de `monthly-balance`. Hoy el orden es estado local de `BalanceScreen` (`useState<SortDirection>('asc')`), así que se pierde al cerrar la app. Las preferencias de notificaciones ya viven en SQLite (`reminder_settings`, fila única) y lo pospuesto en `pending_snoozes`.

## Goals / Non-Goals

**Goals:** conservar el orden entre aperturas, sin que la lista se vea primero en el orden equivocado y luego salte.

**Non-Goals:** recordar la pestaña, el mes o la búsqueda.

## Decisions

### 1. Tabla `ui_preferences` (clave-valor)

`ui_preferences(key TEXT PRIMARY KEY, value TEXT NOT NULL)`, con migración de Drizzle y sin filas iniciales. Las claves son constantes de dominio (`balance.sort`) y los valores se validan al leer: si no son válidos, se usa el valor por omisión.

*Alternativa descartada:* una columna en `reminder_settings`. Mezcla notificaciones con interfaz y obliga a una migración por cada preferencia nueva.

### 2. Repositorio y dominio

- **`src/domain/uiPreferences.ts`:** `BALANCE_SORT_KEY`, `DEFAULT_BALANCE_SORT = 'asc'` y `parseBalanceSort(value): SortDirection`, que devuelve `'asc'` si el valor no existe o no es válido.
- **`UiPreferencesRepository`:** `get(key): Promise<string | null>`, `set(key, value)` (inserta o reemplaza) y `subscribe`, en memoria y en SQLite, con pruebas de contrato.

### 3. `BalanceScreen`

- **Lectura:** el hook `useBalanceSort()` devuelve `{ sort, loaded, setSort }`. Lee la preferencia al montar y la guarda en `setSort`, sin esperar a la base para mostrar el cambio.
- **Sin salto:** mientras `loaded` es falso, la lista de cargos no se dibuja. Ya se espera a los datos de la base para pintarla, así que se suma a esa espera y no se ve un orden y luego el otro.
- **Pruebas:** `BalanceScreen` sigue aceptando el orden inicial para pruebas cuando haga falta.

## Risks / Trade-offs

- [Un valor corrupto en la tabla] → `parseBalanceSort` usa "Más antiguo".

## Migration Plan

La migración agrega la tabla vacía; sin preferencia guardada, el comportamiento es el de hoy. Para revertir, basta con regresar el commit.
