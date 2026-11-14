# Design

## Context

Ver `proposal.md` y `specs/pending-review/spec.md`. Estado actual relevante:

- `src/features/pending/session.ts` guarda lo pospuesto en un `Set` de módulo y `autoDismissed` en una variable de módulo.
- `usePending` filtra `allCharges` y `allPayments` con `pendingSession.isSnoozed(...)` durante el render.
- `BalanceScreen` fuerza un render con `setSessionTick` después de posponer.
- **Causa del bug, verificada:** compilando `usePending.ts` con `babel-plugin-react-compiler`, el filtro queda dentro de un bloque memoizado cuyas dependencias son `confirmations`, `loaded`, `methods.data`, `oneOffs`, `payments`, `recurring` y `today`. Posponer no cambia ninguna, así que se devuelve la lista anterior. `sheetVisible` es un booleano, no se memoiza y sí funciona.
- El compilador se activa por `experiments.reactCompiler` en `app.json`, solo cuando Babel corre con un caller que declara `supportsReactCompiler`, es decir, en Metro. Jest usa otro caller, por eso las pruebas pasan.
- La maqueta aprobada está en `design/propose/pendientes-campana.html`.

## Goals / Non-Goals

**Goals:** que el render reciba lo pospuesto como un valor que cambia; que las pruebas usen el mismo compilador que la app; que la campana y los botones sigan la maqueta.

**Non-Goals:** guardar lo pospuesto entre aperturas o cambiar las reglas de qué es pendiente (`domain/confirmations`, `domain/creditCard`).

## Decisions

### 1. Lo pospuesto como estado de React

`pendingSession` mantiene la vida de "una apertura de la app", porque debe sobrevivir a navegar entre pantallas y se pierde al cerrar la app. Pero se expone como un store suscribible y se lee con `useSyncExternalStore`:

```
session.ts:  snoozed (Set inmutable, se reemplaza al posponer) + autoDismissed
             subscribe(listener) / getSnapshot() -> { snoozed, autoDismissed }
usePendingSession()  = useSyncExternalStore(subscribe, getSnapshot)
usePending(today)    -> lee snoozed del hook y lo usa en el filtro
```

Cada `snooze` crea un `Set` nuevo y avisa a los suscriptores. Así el snapshot cambia de identidad, el compilador ve una dependencia nueva y React vuelve a renderizar. Con esto se eliminan `setSessionTick` y el callback `onSnooze`, que solo existían para forzar renders. `reset()` se queda solo para pruebas.

*Alternativa descartada:* `'use no memo'` en `usePending`. Esconde el problema, que es estado mutable leído durante el render, en lugar de corregirlo.

### 2. Jest con React Compiler

En `babel.config.js`, cuando `NODE_ENV === 'test'` (o con `api.env('test')`), se agrega `babel-plugin-react-compiler` con la misma configuración que usa el preset. La configuración exacta del preset para SDK 58 hay que comprobarla en `babel-preset-expo` antes de escribirla. La primera tarea es ejecutar la suite completa con el compilador y revisar cada falla nueva:

- **Bug real** de lectura de estado mutable: se corrige en este change si es pequeño, o se reporta.
- **Prueba frágil**: se ajusta.

Una prueba nueva reproduce el bug de "Aún no" con el compilador activo antes del arreglo.

### 3. Campana dentro de `BalanceTopBar`

`BalanceTopBar` recibe `pendingCount` y `onOpenPending`. Orden: `[campana][tarjeta][engrane]`, alineados a la derecha como hoy.

- **Activa (`count > 0`):** píldora de 40 px de alto, con radio `pill`, campana de 20 px y el número en `fontWeight 800` con `tabular-nums`. Fondo `alert.bg` y tinta `alert.ink`. `accessibilityLabel` `"Pendientes, N"`.
- **Inactiva:** el mismo ícono de 40 × 40 en `muted` al 45 % de opacidad, `disabled`, con `accessibilityState={{ disabled: true }}` y la etiqueta `"Pendientes, ninguno"`.

Tokens nuevos en `ThemeColors` (o en un grupo `alert`):

| Tema | `alert.bg` | `alert.ink` | Contraste |
|---|---|---|---|
| Claro | `#EDD3D0` | `#A8182C` | 5.24:1 |
| Oscuro | `#381F1F` | `#FF6B6B` | 5.47:1 |

Se agrega una prueba de contraste en `theme.test.ts`, siguiendo el patrón existente.

### 4. `BalanceScreen`

Se quita el bloque `pending-banner` y sus estilos. `forceSheet` lo activa la campana. La lógica de `sheetVisible` y de la apertura automática no cambia, pero `autoDismissed` se lee del hook de sesión y no de la variable de módulo. Si `count` llega a 0 con la hoja abierta, `sheetVisible` ya es falso y la hoja se cierra sola.

### 5. Botones de `PendingSheet`

- **Cobro:** fila `[Aún no][No se cobró]` y debajo `PrimaryButton` "Sí, se cobró" a todo lo ancho.
- **Pago:** fila `[Aún no][Sí, pagué]`.

Se reutilizan `PrimaryButton` y `SecondaryButton`, sin componentes nuevos.

### 6. Regla escrita

En `src/ui/README.md`: "La acción que cancela, cierra o pospone va a la izquierda; la que confirma va a la derecha o abajo. En alertas, `Cancelar` va primero con `style: 'cancel'`." Esto ya se cumple en `SheetLayout` y en las alertas existentes.

## Risks / Trade-offs

- [Activar el compilador en Jest rompe muchas pruebas] → la tarea 1 lo mide primero. Si el ruido es grande, se activa solo para `src/features/**` y se deja una nota con lo pendiente.
- [Perder la apertura automática al mover `autoDismissed`] → las pruebas actuales de "cerrar la hoja la deja disponible…" y las del atajo se adaptan a la campana y deben seguir pasando.
- [Píldora roja confundida con un error] → es un tinte suave y lleva el número. El rojo sólido queda solo para errores y para eliminar.

## Migration Plan

Sin datos. Se entrega en la siguiente beta. Para revertir, basta con regresar el commit.
