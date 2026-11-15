# Proposal

## Why

En la lista de "Este mes", el orden ("Más antiguo" / "Más reciente") se reinicia a "Más antiguo" cada vez que se cierra la app. Quien prefiere ver primero lo más reciente tiene que cambiarlo en cada apertura.

## What Changes

- El orden elegido en la lista de "Este mes" se guarda en el teléfono y se conserva entre aperturas de la app.
- Sin nada guardado (instalación nueva), el orden sigue siendo "Más antiguo".
- **Sin cambios:** la pestaña "Este mes | Análisis" siempre abre en "Este mes", el mes siempre es el actual y el buscador se vacía al salir.

**Fuera de alcance:** recordar la pestaña, el mes o la búsqueda, y sincronizar preferencias entre dispositivos.

## Capabilities

### New Capabilities
<!-- Ninguna -->

### Modified Capabilities
- `monthly-balance`: "Orden de la lista de Este mes" conserva el orden elegido entre aperturas de la app.

## Impact

- **Datos:** una tabla nueva en SQLite para preferencias de interfaz (clave-valor), con su migración, repositorio y contrato. Sirve también para futuras preferencias de interfaz sin una migración por cada una.
- **Código:** `src/features/balance/BalanceScreen.tsx` lee y guarda el orden.
- **Dependencias:** ninguna nueva.
