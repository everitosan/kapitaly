# Tasks

## 1. Dependencias

- [x] 1.1 Instalar `expo-mail-composer` y `expo-image-picker` con `npx expo install`; revisar en la documentación v58 las firmas de `composeAsync`, `isAvailableAsync` y `launchImageLibraryAsync`; configurar el plugin de `expo-image-picker` en `app.json` sin permiso de cámara; agregar mocks de los dos módulos en `jest.setup.ts`. Verificación: `npx expo config --type public` muestra el plugin, `npx expo-doctor` no reporta problemas nuevos y la suite corre.

## 2. Armado del correo (dominio puro)

- [x] 2.1 `src/domain/feedback.ts` con límites, `canSend`, `buildSubject`, `buildBody` y `describeDevice`. Verificación: pruebas unitarias con los textos del spec (asunto con versión, diagnóstico al final, texto recortado, solo espacios no se envía, dispositivo sin modelo).

## 3. Pantalla Comentarios

- [x] 3.1 `src/features/feedback/config.ts` (`FEEDBACK_EMAIL`) y `diagnostics.ts` (versión, modelo y sistema con `expo-constants` y `expo-device`). Verificación: prueba de `diagnostics` con los módulos mockeados.
- [x] 3.2 `FeedbackScreen` y la ruta `settings/feedback`, según la maqueta: texto con contador y límite, aviso de diagnóstico, botón deshabilitado sin texto. Verificación: pruebas de los escenarios "Sin texto", "Límite de texto" y "Aviso de diagnóstico".
- [x] 3.3 Capturas: agregar con el selector (con lo que falte para llegar a 3), quitar, ocultar el botón con 3 y no cambiar nada si se cancela. Verificación: pruebas con un doble del selector para "Agregar y quitar", "Máximo de capturas" y "Cancelar el selector".
- [x] 3.4 Enviar: llamar a `composeAsync` con destinatario, asunto, cuerpo y adjuntos; mostrar "Se abrió tu correo para enviar los comentarios" y conservar el formulario; estado "No hay una app de correo" si `isAvailableAsync` es falso. Verificación: pruebas de "Correo listo", "Volver a la app" y "Teléfono sin correo".

## 4. Ajustes

- [x] 4.1 Sección "Beta" con la fila "Comentarios" en `SettingsScreen` y navegación a `/settings/feedback`. Verificación: pruebas de `SettingsScreen` actualizadas a los escenarios modificados de `settings-menu` ("Ir a Comentarios" y la lista completa de opciones).

## 5. Cierre

- [x] 5.1 Ejecutar `npm test`, `npm run typecheck` y `npm run lint`. Verificación: los tres pasan.
- [x] 5.2 Probar en el teléfono con la beta: mandar un comentario con 2 capturas por Gmail y comprobar que llega a `eve.san.dev@gmail.com` con el asunto, el diagnóstico y los adjuntos. Verificación: lo confirma el usuario.
