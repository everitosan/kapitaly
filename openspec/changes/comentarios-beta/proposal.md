# Proposal

## Why

La beta va a llegar a amigos que la van a probar, y hoy no tienen una forma fácil de mandar comentarios desde la app. La app no tiene servidor, y la idea es que siga sin depender de uno.

## What Changes

- **Sección "Beta" en Ajustes** con la opción **"Comentarios"**: "Cuéntame qué mejorar, con capturas".
- **Pantalla Comentarios:** un texto obligatorio (hasta 2,000 caracteres) y hasta 3 capturas opcionales, elegidas de la galería con el selector de fotos del sistema.
- **"Enviar por correo"** abre la app de correo del teléfono con todo listo, y la persona revisa y toca Enviar:
  - para: `eve.san.dev@gmail.com`;
  - asunto: "Comentarios · KPTLY expenses {versión}";
  - el texto, y al final la versión de la app y el modelo y la versión de Android;
  - las capturas como adjuntos.

  La app no envía nada por su cuenta.
- **Sin app de correo:** el botón se deshabilita, se explica por qué y lo escrito se conserva.

Maqueta: `design/propose/comentarios-y-atajo.html`.

**Fuera de alcance:** un servidor o servicio de formularios (Formspree, Cloudflare Worker), comentarios anónimos, guardar borradores entre aperturas y la versión para iOS más allá de lo que el código común ya cubra.

## Capabilities

### New Capabilities
- `beta-feedback`: enviar comentarios con capturas al desarrollador desde la app, usando la app de correo del teléfono.

### Modified Capabilities
- `settings-menu`: Ajustes agrega la sección "Beta" con "Comentarios".

## Impact

- **Dependencias:** `expo-mail-composer` y `expo-image-picker`, ambos con código nativo, así que requieren un build nuevo (ya se hace por CI). `expo-device` y `expo-constants` ya están instalados.
- **Código:** la ruta `settings/feedback`, `src/features/feedback/`, un armador puro del correo y la fila en `SettingsScreen`.
- **Privacidad / Play:** la app no transmite datos (el envío lo hace el usuario desde su correo), así que la declaración de seguridad de datos no cambia. `eve.san.dev@gmail.com` queda dentro de la app.
- **Orden de archivo:** el delta de `settings-menu` parte de la versión que deja `notificaciones-recordatorios`; ese change debe archivarse antes.
