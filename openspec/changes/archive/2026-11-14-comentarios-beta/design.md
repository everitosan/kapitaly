# Design

## Context

Ver `proposal.md` y los specs `beta-feedback` y `settings-menu`. Estado actual:

- La app es local y no hace llamadas de red. El formulario de seguridad de datos de Play dice que no recolecta datos.
- `expo-constants` (versión de la app) y `expo-device` (modelo y versión del sistema) ya están instalados. La versión de una beta la inyecta `app.config.js` desde el tag (`0.1.0-beta.N`), así que `Constants.expoConfig.version` la refleja en el build.
- Según la documentación de SDK 58, `expo-mail-composer`:
  - con `composeAsync` acepta destinatarios, asunto, cuerpo y `attachments` (URIs internas de archivos);
  - en Android siempre responde `sent`, aunque el usuario cancele;
  - con `isAvailableAsync` indica si hay correo configurado.
- Maqueta: `design/propose/comentarios-y-atajo.html`.

## Goals / Non-Goals

**Goals:** enviar comentarios con capturas sin servidor, sin pedir permisos innecesarios y con el armado del correo en código puro y probado.

**Non-Goals:** confirmar que el correo se envió de verdad (Android no lo informa), borradores persistentes y un endpoint propio. Si la beta crece, se puede hacer después con un Cloudflare Worker y el mismo formulario.

## Decisions

### 1. Correo del sistema con `expo-mail-composer`

Se instala con `npx expo install expo-mail-composer`. Al montar la pantalla, `isAvailableAsync()` decide si se muestra el aviso "No hay una app de correo". Al enviar:

```
composeAsync({
  recipients: [FEEDBACK_EMAIL],
  subject: buildSubject(version),
  body: buildBody(text, diagnostics),
  attachments: shots.map((s) => s.uri),
})
```

Como en Android el resultado no es confiable, siempre se muestra "Se abrió tu correo para enviar los comentarios" y el formulario no se limpia.

`FEEDBACK_EMAIL = 'eve.san.dev@gmail.com'` vive en `src/features/feedback/config.ts`, en un solo lugar.

*Alternativas descartadas:* `mailto:` con `Linking` (no admite adjuntos) y servicios de formularios (los adjuntos son de pago, y la app pasaría a transmitir datos).

### 2. Capturas con `expo-image-picker`

Se usa `launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 3 - actuales, quality: 0.7 })`. En Android 13+ abre el Photo Picker del sistema, que no pide permisos; en versiones anteriores, el plugin declara el permiso de lectura. Se configura el plugin en `app.json` sin el permiso de cámara (`cameraPermission: false`), porque solo se elige de la galería. Las URIs que regresa están en la caché de la app, y `expo-mail-composer` las comparte con su FileProvider. Las firmas y opciones exactas se revisan en la documentación v58 antes de escribir.

Las miniaturas se muestran con `expo-image`, que ya está instalado. Cada una tiene un botón "Quitar captura".

### 3. Armado puro del correo

`src/domain/feedback.ts`, sin Expo:

- `FEEDBACK_MAX_TEXT = 2000`, `FEEDBACK_MAX_SHOTS = 3`.
- `canSend(text, mailAvailable)`.
- `buildSubject(version)` devuelve "Comentarios · KPTLY expenses {versión}".
- `buildBody(text, { version, device, os })` devuelve el texto recortado, una línea en blanco, "—", "Versión: …" y "Teléfono: {modelo} · {sistema}".
- `describeDevice(model, osName, osVersion)` arma "Pixel 7 · Android 15", y queda en "Android 15" si no hay modelo.

Los datos los reúne `src/features/feedback/diagnostics.ts` con `expo-constants` y `expo-device`.

### 4. Pantalla y navegación

- Ruta `src/app/settings/feedback.tsx` y pantalla `src/features/feedback/FeedbackScreen.tsx`, que siguen la maqueta: `TextField` multilínea con contador, fila de capturas, el aviso de diagnóstico, el estado sin correo con el tinte `alert` y el botón principal fijo abajo.
- La pantalla recibe como parámetros el compositor de correo y el selector de imágenes, para probarla con dobles.
- En Ajustes se agrega la sección "Beta" (`SectionLabel`) con la fila "Comentarios", con un ícono de globo de diálogo sobre `frequency.bimonthly`.

## Risks / Trade-offs

- [El correo de los testers queda a la vista y hay un paso extra] → es aceptable en una beta entre amigos y permite responderles directo.
- [Adjuntos pesados] → `quality: 0.7` y máximo 3 imágenes. Gmail acepta 25 MB.
- [Algunos clientes de correo ignoran los adjuntos del intent] → se verifica con Gmail en la beta. Si falla, se documenta y se recomienda Gmail.
- [`eve.san.dev@gmail.com` dentro del APK] → es un correo de desarrollador, pensado para esto.

## Migration Plan

Sin datos. Se entrega en una beta con build nuevo. El delta de `settings-menu` supone que `notificaciones-recordatorios` ya se archivó: hay que archivarlo antes que este.
