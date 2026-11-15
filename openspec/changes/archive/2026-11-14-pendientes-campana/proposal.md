# Proposal

## Why

En la app instalada, "Aún no" en la hoja "Pendientes" no hace nada. El React Compiler, activo en el bundle pero no en Jest, guarda en caché la lista de pendientes, y esa lista solo cambia con los datos de la base. Posponer un pendiente modifica un `Set` global que el compilador no ve, así que la tarjeta se queda y las pruebas no lo detectan.

Además, el aviso grande de pendientes ocupa espacio debajo de "Este mes | Análisis", y las dos tarjetas de la hoja ponen "Aún no" en lugares distintos.

## What Changes

- **"Aún no" funciona:** al posponer, la tarjeta sale de la hoja y el número de pendientes baja en ese momento. Las pruebas corren con el React Compiler, para que este tipo de error falle en Jest.
- **"Aún no" pasa a "Posponer" por 6 horas** (tras probar la beta 6, porque la hoja que salta en cada apertura resultaba muy intensa):
  - "Posponer" en una tarjeta la oculta de la hoja y de la campana durante 6 horas, aunque se cierre la app, y muestra "Volveré a avisarte dentro de 6 hrs".
  - "Cerrar" la hoja evita que vuelva a abrirse sola durante 6 horas; los pendientes siguen contando en la campana.
  - Pasado el plazo, la tarjeta vuelve con la opción de posponer otra vez. El plazo es fijo; no se configura.
  - Las notificaciones del teléfono no cambian.
- **Campana en la barra superior:** el aviso grande desaparece. Junto a Métodos de pago y Ajustes aparece una campana que abre la hoja "Pendientes".
  - Con pendientes, la campana es una píldora con tinte rojo y el número.
  - Sin pendientes, se ve tenue y no responde al toque.
  - Si se pospone todo, queda inactiva hasta que venza el plazo de 6 horas.
- **Botones de la hoja consistentes:** "Posponer" va siempre primero, a la izquierda. Cobro: `[Posponer][No se cobró]` y abajo `[Sí, se cobró]`. Pago: `[Posponer][Sí, pagué]`.
- **Regla de UI escrita:** "la acción que cancela o pospone va a la izquierda; la que confirma, a la derecha o abajo" se agrega al documento del sistema de diseño. Hoy el resto de la app ya la cumple.
- **Apertura automática:** la hoja se abre sola al arrancar si hay pendientes sin posponer y no se cerró en las últimas 6 horas, excepto desde el atajo "Nuevo gasto".

Maqueta: `design/propose/pendientes-campana.html`.

**Fuera de alcance:** cambiar las notificaciones del sistema, configurar el plazo de 6 horas y revisar desde la campana lo que está pospuesto.

## Capabilities

### New Capabilities
- `pending-review`: cómo el usuario llega a la hoja "Pendientes" y la usa. Incluye la campana con sus estados, la apertura automática, posponer por 6 horas y el orden de las acciones en cada tarjeta.

### Modified Capabilities
- `recurring-expenses`: "Aún no" pasa a "Posponer", y el cobro vuelve a preguntarse pasadas 6 horas, no en la siguiente apertura.
- `credit-cards`: lo mismo para el aviso en la fecha de pago.

## Impact

- **Código:** `src/features/pending/` (estado de lo pospuesto, `usePending`, `PendingSheet`), `src/features/balance/BalanceScreen.tsx` (se quita el aviso), `src/ui/components/balance.tsx` (campana en `BalanceTopBar`), tokens de alerta en `src/ui/theme.ts`, `src/ui/README.md`.
- **Pruebas:** configuración de Jest/Babel para aplicar el React Compiler. Puede revelar otros lugares que leen estado mutable durante el render.
- **Datos:** una tabla nueva en SQLite para lo pospuesto (clave y fecha límite), con su migración, repositorio y contrato.
- **Dependencias:** ninguna nueva; `babel-plugin-react-compiler` ya está instalado.
