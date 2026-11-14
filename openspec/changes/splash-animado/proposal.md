# Proposal

## Why

Al abrir la app hoy aparece un splash fijo, solo el ícono sobre crema o casi negro según el tema. Ese splash no coincide con el diseño de marca de `design/splash-expenses.svg`, que tiene fondo `#020903`, el logo de círculos y el texto "KPTLY expenses". El splash nativo de Android no se puede animar con Expo y en Android 12+ solo muestra un ícono centrado, así que ni el texto ni la animación que queremos caben ahí.

## What Changes

- **Splash de marca animado:** al abrir la app aparece el diseño de `design/splash-expenses.svg` sobre fondo `#020903`. Los cuatro círculos con degradado brotan, uno tras otro, de la esquina inferior derecha del cuadro del logo, del menor al mayor, y cada uno queda detrás del anterior (variante C de la maqueta). Después aparece el texto "KPTLY expenses". La animación dura ~1.2 s y termina con un fundido hacia la app.
- **Siempre oscuro:** el splash usa `#020903` en los dos temas del sistema, porque es identidad de marca. La app conserva sus temas claro y oscuro.
- **Splash nativo sin logo:** el splash del sistema muestra solo el fondo `#020903`, y la animación empieza sobre ese mismo fondo, sin salto visible.
- **Espera real:** el splash se va cuando terminan la animación **y** la preparación de la base de datos, lo que tarde más.
- **Excepciones:** al abrir desde el acceso directo o el atajo "Nuevo gasto" no hay animación, para que el formulario siga apareciendo de inmediato. Si el sistema pide reducir el movimiento, se muestra el diseño fijo, sin animación.

**Fuera de alcance:** animar el ícono del launcher, mostrar un splash al volver de segundo plano (solo hay splash en el arranque en frío), iOS más allá de lo que el código común ya cubra, y cambios al ícono de la app.

## Capabilities

### New Capabilities
- `app-splash`: lo que el usuario ve mientras la app arranca en frío. Incluye el diseño de marca, la animación, cuándo se omite y cuándo se oculta.

### Modified Capabilities
<!-- Ninguna: quick-add-shortcut y app-theme no cambian sus requisitos; el nuevo spec define cómo convive el splash con ellos. -->

## Impact

- **Configuración:** `app.json`, plugin `expo-splash-screen` (fondo `#020903` en los dos temas, sin logo visible). Puede necesitar un asset transparente.
- **Código:** un componente de splash fuera de `src/app/` con `react-native-svg` y `react-native-reanimated` (ya instalados), integrado en `src/app/_layout.tsx` junto a las migraciones.
- **Dependencias:** ninguna nueva (`expo-splash-screen` y `expo-linking` ya están).
- **Pruebas:** pruebas de componente para las reglas de omisión y ocultamiento. La apariencia del splash nativo se comprueba en un build release, porque Expo Go no muestra el splash real.
