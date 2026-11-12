# Design

## Context

Ver `proposal.md` para la motivación y `specs/android-beta-release/spec.md` para el comportamiento requerido. El proyecto usa Expo SDK 58, npm con `package-lock.json`, Jest, y scripts `lint` y `typecheck`. Los directorios nativos están ignorados y se generan mediante CNG. No hay configuración EAS ni workflow de publicación existente.

El usuario confirmó que la compilación y publicación deben ocurrir exclusivamente en GitHub Actions, sin EAS ni cuenta de Expo. Esta decisión prevalece sobre la recomendación general de EAS de `AGENTS.md` para este cambio.

## Goals / Non-Goals

**Goals:** Generar el proyecto Android de manera reproducible, separar las comprobaciones de las operaciones que usan secretos, y entregar el mismo tipo de AAB firmado en los modos manual y automático.

**Non-Goals:** Mantener un proyecto Android a mano, crear infraestructura de Expo o modificar el esquema de datos de la app. La instalación desde Play será una identidad nueva, sin migración desde Expo Go.

## Decisions

### 1. CNG y Gradle en un runner Linux

Usar un runner Ubuntu con versión explícita, `npm ci`, Node y JDK compatibles con SDK 58, y el SDK Android requerido por el proyecto generado. Ejecutar `npx expo prebuild --platform android --no-install` y el wrapper Gradle generado con `:app:bundleRelease`. Determinar las versiones concretas de Node/JDK/SDK contra los requisitos oficiales y la plantilla de SDK 58 durante la implementación, y dejarlas fijadas en el workflow. El bundle incluye JavaScript y recursos para funcionar sin Metro.

No se versiona ni se edita manualmente `android/`. Agregar un config plugin local en `plugins/withAndroidReleaseSigning.js` para configurar la firma release mediante variables de entorno; el plugin debe fallar ante una configuración parcial y nunca poner valores secretos en Gradle generado. La compilación de publicación debe rechazar una firma debug. Es preferible a parches de texto ejecutados después de prebuild, que se perderían al regenerar, y evita depender de EAS.

### 2. Versionado determinista y configuración dinámica

Mantener `app.json` como configuración base y añadir `app.config.js`, que preserve todas sus propiedades e inyecte versión y `android.versionCode` solamente cuando se solicite un build beta. Cambiar los identificadores Android e iOS conforme a la propuesta.

Un módulo puro en `scripts/` valida el formato completo del tag y calcula el código de la spec; su interfaz CLI entrega únicamente valores validados al workflow. Rechazar ceros iniciales ambiguos, valores no seguros, Y o Z mayores de 99, N fuera de 1..98 y códigos superiores al límite Android de 2100000000. Los límites de Y/Z evitan colisiones entre los segmentos de la fórmula. Sin variables de beta, el desarrollo conserva la versión base. El modo manual recibe la misma versión beta y deriva el código mediante el mismo módulo, sin permitir un código arbitrario discordante.

### 3. Un workflow con dos entradas

`.github/workflows/android-beta.yml` escucha tags candidatos `v*-beta.*` y `workflow_dispatch`. El filtro de tags de Actions no es una expresión regular: un primer paso valida el formato exacto; cualquier candidato inválido termina sin compilar ni publicar. Los tags estables no activan el workflow.

Obtener historia y ramas remotas completas. Resolver el tag a commit, comprobar pertenencia por ancestro a una rama remota `release/*` y comprobar que esa rama corresponde a X.Y.0. En ejecución manual, exigir una referencia de rama `release/X.Y.0` y una versión base coincidente. No interpolar entradas del evento dentro de shell: usar variables de entorno y argumentos citados.

Ejecutar pruebas en modo CI, typecheck y lint antes de prebuild. El modo manual requiere los cuatro secretos de firma y genera un artefacto descargable; el modo tag requiere además la credencial de Google Play y publica exclusivamente en `internal`. El workflow con `workflow_dispatch` debe existir en la rama por defecto para poder lanzarse desde la interfaz.

Usar concurrencia global para las publicaciones Android, sin cancelar una publicación en curso, para evitar ediciones simultáneas en Play. Play rechazará códigos ya usados o menores; la guía debe explicar que se crea otra beta, en lugar de mover/reutilizar un tag publicado. No usar un contador de ejecución, porque dejaría de ser reproducible desde el tag.

### 4. Firma, secretos y publicación

Secrets: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` y `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`. Verificar presencia por nombre antes de compilar, sin imprimir valores. Decodificar la llave bajo `RUNNER_TEMP`, restringir permisos, entregar su ruta mediante entorno y limpiar archivos temporales con un paso `always()`. No incluir la llave ni credenciales en artefactos o cachés; ignorar también `*.keystore` y `*.aab`.

Verificar la firma del AAB con las herramientas del JDK y que su certificado coincide con la llave de subida antes de cargarlo. Publicar mediante `r0adkll/upload-google-play`, fijado a un SHA revisado, con paquete `com.kapitaly.expenses`, pista `internal` y credencial desde un archivo temporal. Fijar también las otras acciones a SHAs revisados. Limitar permisos de `GITHUB_TOKEN` a `contents: read`; la autorización para Play procede de la cuenta de servicio con acceso limitado a esta app.

La publicación automática se habilita después de completar la primera carga manual y los formularios de Play. Si la app sigue en borrador, documentar cómo completar su configuración antes de usar el flujo automático; no promocionar a otra pista como alternativa a un error. Conservar el AAB firmado con retención acotada para diagnóstico y primera carga. La cuenta de servicio es una identidad técnica dentro de Google Cloud, no una cuenta de Expo.

## Risks / Trade-offs

- Cambios de plantilla nativa o herramientas: fijar versiones y probar generación y bundle en una ejecución real de Actions antes de dar por validado el flujo.
- Pérdida de la llave de subida: respaldarla fuera del repositorio y documentar recuperación en Play App Signing.
- Límites o condiciones de servicios externos: la solución evita servicios de Expo, pero no promete gratuidad universal de Google Play ni de runners; comprobar las condiciones de las cuentas existentes.
- Formularios de privacidad incorrectos: revisar dependencias, permisos y tráfico del build release antes de indicar qué declarar; no inferir toda la declaración solamente del uso local de SQLite.
- Mismo código o publicación fuera de orden: serializar cargas y crear una nueva beta con código superior al ya aceptado.
- Cambio de identificador: comunicar que la instalación de Play no recupera los datos guardados en Expo Go o en el paquete anterior.

## Migration Plan

1. Incorporar configuración, plugin, scripts, workflow y guía en una rama revisable; ejecutar pruebas, lint y typecheck.
2. Preparar la llave y su respaldo, secrets de GitHub y acceso de la cuenta de servicio a la app en Play Console. No guardar secretos en el chat o el repositorio.
3. Disponer del workflow en la rama por defecto y de `release/0.1.0` en el remoto. Ejecutar manualmente para `0.1.0-beta.1`, descargar el AAB y cargarlo en Play Console; completar los requisitos y testers de la pista interna.
4. Instalar desde Play, comprobar que inicia y funciona sin Metro (todos los datos viven en el teléfono). Publicar una beta posterior mediante tag para verificar el circuito automático y la actualización conservando los datos locales de esa instalación.
5. Ante un fallo, detener nuevas publicaciones y corregir el workflow; no borrar tags ni reducir códigos. Para corregir una beta ya distribuida, emitir otra con código mayor. No se revierte el identificador de una app ya publicada como mecanismo de rollback.

## References

- https://docs.expo.dev/versions/v58.0.0/
- https://docs.expo.dev/guides/local-app-production/
- https://docs.expo.dev/config-plugins/introduction/
- https://developers.google.com/android-publisher
- https://github.com/r0adkll/upload-google-play
