# Proposal

## Why

Quienes prueban la beta no se enteran cuando hay una versión nueva, a menos que abran Play Store y la busquen. Sin servidor propio, la app no tiene cómo saber que existe una beta más reciente.

## What Changes

- **Detección al abrir la app:** la app le pregunta a Google Play (API oficial de in-app updates, a través de la app de Play Store del teléfono) si hay una versión más nueva disponible para ese usuario. No hace llamadas de red propias.
- **Aviso en el balance:** una tarjeta arriba del mes, con tres estados:
  - "Nueva versión disponible", el nombre de la versión, [Actualizar] y [x];
  - "Descargando la nueva versión… N %";
  - "Lista para instalar" con [Reiniciar].
- **Flujo flexible:** "Actualizar" abre la confirmación de Google y la descarga sigue en segundo plano mientras se usa la app; "Reiniciar" instala y vuelve a abrir la app actualizada.
- **Respaldo:** si el flujo de Google falla, "Actualizar" abre la página de la app en Play Store.
- **[x]:** oculta el aviso en esa apertura; vuelve en la siguiente mientras no se actualice. "Lista para instalar" no se puede ocultar.
- **Solo instalaciones de Play:** en Expo o builds locales no aparece ningún aviso.
- Funciona igual en la pista de prueba interna y en producción.

**Fuera de alcance:** actualizaciones obligatorias (flujo inmediato), prioridades de actualización y avisos en iOS.

## Capabilities

### New Capabilities
- `app-updates`: detectar en Google Play una versión más nueva de la app y llevar al usuario a instalarla sin salir de la app.

### Modified Capabilities
<!-- Ninguna -->

## Impact

- **Nativo:** funciones nuevas en el módulo local `modules/kapitaly-shortcuts` (o un módulo hermano) con la dependencia `com.google.android.play:app-update`. Requiere build nuevo.
- **Código:** un hook y un componente de tarjeta en `src/features/updates/`, montado en `BalanceScreen`.
- **Privacidad / Play:** la app no transmite datos; la consulta la responde Play Store con lo que ya conoce.
- **Pruebas:** la lógica, con un doble del módulo nativo en Jest; el flujo real, con dos betas seguidas en el teléfono.
