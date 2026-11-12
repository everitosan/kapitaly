# Tasks

## 1. Identidad y versión de la beta

- [x] 1.1 Cambiar los identificadores Android e iOS a `com.kapitaly.expenses` y añadir configuración dinámica que preserve `app.json`; verificar con `npx expo config --type public` en desarrollo y con variables de beta que no se pierden plugins, iconos ni opciones existentes.
- [x] 1.2 Implementar el módulo y CLI de validación/versionado en `scripts/`; cubrir con pruebas el tag válido, coincidencia con versión base, código 10002, orden entre versiones, N fuera de rango, segmentos inválidos y límites contra colisiones y desbordamiento; ejecutar las pruebas con éxito.
- [x] 1.3 Documentar en `docs/android-beta.md` la fórmula, formato del tag, rama `release/X.Y.0`, nueva identidad y ausencia de migración desde Expo Go; contrastar ejemplos con la salida del CLI.

## 2. Compilación y firma sin EAS

- [x] 2.1 Implementar `plugins/withAndroidReleaseSigning.js` y registrarlo en la configuración; comprobar con pruebas del plugin que Gradle usa referencias al entorno sin incrustar valores secretos, que rechaza configuración parcial y que release no usa firma debug.
- [x] 2.2 Añadir al workflow la instalación reproducible con `npm ci`, Node/JDK/SDK compatibles con Expo 58 y generación con prebuild seguida de `:app:bundleRelease`; fijar versiones y SHAs de las acciones, validar sintaxis del workflow y comprobar que no se versionan ni editan manualmente directorios nativos.
- [x] 2.3 Configurar decodificación de la llave temporal, permisos restringidos, verificación del certificado del AAB, limpieza `always()` y artefacto de retención acotada; ignorar `*.keystore` y `*.aab`, verificar ausencia de secretos en logs, artefactos y cachés y rechazo de secretos de firma ausentes antes de compilar.
- [x] 2.4 Documentar generación y respaldo de la llave de subida, los cuatro secretos de firma y descarga del artefacto; revisar que los pasos usan únicamente GitHub y herramientas Android, sin cuenta ni comandos EAS.

## 3. Disparadores y publicación interna

- [x] 3.1 Incorporar disparadores de tags candidatos y ejecución manual, validar formato exacto, versión base y pertenencia a la rama release con historia completa; comprobar con pruebas de la validación los casos válidos, versión distinta, tag sin rama release, entrada manual fuera de release e intentos de inyección de shell.
- [x] 3.2 Ejecutar pruebas CI, typecheck y lint antes de compilar; comprobar que un fallo de cualquiera impide el build y la publicación, y que tags estables no activan el workflow.
- [x] 3.3 Añadir publicación con `r0adkll/upload-google-play` fijado a SHA, paquete `com.kapitaly.expenses`, pista `internal`, credencial temporal y concurrencia sin cancelación; verificar que modo manual no publica ni exige la credencial Play y que modo tag falla antes del build si esta falta.
- [ ] 3.4 Completar `docs/android-beta.md` y enlazarla desde README: cuenta de servicio y permisos mínimos en Google Cloud/Play, API, secret JSON, primera carga manual, formularios y testers, requisitos de rama por defecto, tags posteriores y recuperación ante códigos repetidos; revisar los pasos contra documentación oficial vigente y no afirmar declaraciones de privacidad sin revisar dependencias y permisos.

## 4. Verificación integrada y primera distribución

- [x] 4.1 Ejecutar pruebas completas, `npm run lint` y `npm run typecheck`; validar el cambio con `openspec validate publicacion-beta-play-store --strict` y registrar resultados y cualquier bloqueo real.
- [ ] 4.2 Con acceso y secretos preparados, ejecutar el workflow manual sobre `release/0.1.0` para la primera beta disponible; comprobar que entrega un AAB firmado con paquete, versión y código esperados y no realiza ninguna carga a Play.
- [x] 4.3 Realizar la primera carga manual en Play Console, completar la configuración necesaria y habilitar testers internos; verificar instalación desde Play y funcionamiento de balance y gastos sin Metro. Mantener pendiente si faltan acciones o acceso del usuario.
- [x] 4.4 Publicar un tag de beta posterior sobre release y verificar la ejecución automática, versión en la pista interna y actualización desde Play conservando datos locales; comprobar logs y artefactos sin credenciales y documentar evidencia sin datos privados. Mantener pendiente hasta observar el resultado real.
