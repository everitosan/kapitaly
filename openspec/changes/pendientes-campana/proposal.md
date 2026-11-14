# Proposal

## Why

En la app instalada, "Aún no" en la hoja "Pendientes" no hace nada. El React Compiler, activo en el bundle pero no en Jest, guarda en caché la lista de pendientes, y esa lista solo cambia con los datos de la base. Posponer un pendiente modifica un `Set` global que el compilador no ve, así que la tarjeta se queda y las pruebas no lo detectan.

Además, el aviso grande de pendientes ocupa espacio debajo de "Este mes | Análisis", y las dos tarjetas de la hoja ponen "Aún no" en lugares distintos.

## What Changes

- **"Aún no" funciona:** al posponer, la tarjeta sale de la hoja y el número de pendientes baja en ese momento. Lo pospuesto se vuelve a preguntar en la siguiente apertura de la app, como ya dicen los specs. Las pruebas corren con el React Compiler, para que este tipo de error falle en Jest.
- **Campana en la barra superior:** el aviso grande desaparece. Junto a Métodos de pago y Ajustes aparece una campana que abre la hoja "Pendientes".
  - Con pendientes, la campana es una píldora con tinte rojo y el número.
  - Sin pendientes, se ve tenue y no responde al toque.
  - Si se pospone todo, queda inactiva hasta la siguiente apertura.
- **Botones de la hoja consistentes:** "Aún no" va siempre primero, a la izquierda. Cobro: `[Aún no][No se cobró]` y abajo `[Sí, se cobró]`. Pago: `[Aún no][Sí, pagué]`.
- **Regla de UI escrita:** "la acción que cancela o pospone va a la izquierda; la que confirma, a la derecha o abajo" se agrega al documento del sistema de diseño. Hoy el resto de la app ya la cumple.
- **Sin cambios:** la hoja se sigue abriendo sola al arrancar si hay pendientes, excepto desde el atajo "Nuevo gasto".

Maqueta: `design/propose/pendientes-campana.html`.

**Fuera de alcance:** notificaciones del sistema (push o locales), pospuestos que sobrevivan al cierre de la app, y revisar lo pospuesto desde la campana (opción b).

## Capabilities

### New Capabilities
- `pending-review`: cómo el usuario llega a la hoja "Pendientes" y la usa. Incluye la campana con sus estados, la apertura automática, posponer durante la sesión y el orden de las acciones en cada tarjeta.

### Modified Capabilities
<!-- Ninguna: recurring-expenses y credit-cards ya piden que "Aún no" no guarde nada y vuelva a preguntar en la siguiente apertura; este cambio hace que se cumpla. -->

## Impact

- **Código:** `src/features/pending/` (estado de lo pospuesto, `usePending`, `PendingSheet`), `src/features/balance/BalanceScreen.tsx` (se quita el aviso), `src/ui/components/balance.tsx` (campana en `BalanceTopBar`), tokens de alerta en `src/ui/theme.ts`, `src/ui/README.md`.
- **Pruebas:** configuración de Jest/Babel para aplicar el React Compiler. Puede revelar otros lugares que leen estado mutable durante el render.
- **Dependencias:** ninguna nueva; `babel-plugin-react-compiler` ya está instalado.
