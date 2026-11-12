# Proposal

## Why

La v1 de kapitaly-expenses ya funciona en el teléfono con Expo Go, pero así depende de la computadora de desarrollo (el código se descarga de ella al abrir la app) y no sirve para usarla en el día a día. Publicarla en la pista de **prueba interna** de Google Play permite instalarla como una app normal, recibir actualizaciones desde Play Store y usarla sin depender de la computadora, sin costo y sin pasos manuales en cada versión.

## What Changes

- **BREAKING (identidad de la app):** el paquete de Android pasa de `app.kapitaly.expenses` a `com.kapitaly.expenses`, que es el que el usuario ya registró en Play Console. Se alinea el identificador de iOS al mismo valor. La app instalada con el paquete anterior no se actualiza: la versión de Play es una instalación nueva. Hoy solo existen datos de prueba en Expo Go, así que no hay datos que migrar.
- **Publicación automática con GitHub Actions:** al hacer push de un tag `vX.Y.Z-beta.N` creado en la rama `release/X.Y.0`, un workflow corre pruebas, typecheck y lint, compila el `.aab` de Android en el runner (sin EAS ni cuenta de Expo), lo firma con la llave de subida y lo publica en la pista de prueba interna de Play.
- **Versiones derivadas del tag:** `versionName` = `X.Y.Z-beta.N` y `versionCode` calculado del tag de forma creciente. El workflow rechaza tags que no coincidan con la versión de `app.json` o que no vengan de una rama release.
- **Primer `.aab` manual:** Google exige subir a mano la primera versión de una app nueva. El workflow ofrece una ejecución manual que genera el `.aab` firmado como archivo descargable, sin publicarlo.
- **Guía de configuración** en `docs/`: crear la llave de subida, cargar los secrets en GitHub, crear la cuenta de servicio de Google Cloud y darle acceso en Play Console, hacer la primera subida, agregar testers y llenar el formulario de seguridad de datos (la app no recolecta datos).

**Fuera de alcance:** iOS y TestFlight, producción y promoción entre pistas, actualizaciones OTA (EAS Update) y firma gestionada por Expo.

## Capabilities

### New Capabilities
- `android-beta-release`: compilación, firma, versionado y publicación de betas de Android en la pista de prueba interna de Google Play a partir de tags, con sus validaciones previas.

### Modified Capabilities
<!-- Ninguna: no cambia el comportamiento de la app; solo su identificador y cómo se distribuye. -->

## Impact

- **Código y configuración:** `app.json` (paquetes) o un `app.config.ts` que inyecte `versionCode`/`versionName` en el build; nuevo `.github/workflows/android-beta.yml`; un script de versionado; guía en `docs/`.
- **Servicios externos:** GitHub Actions (gratis en repos públicos) y la API de publicación de Google Play. Sin costo de uso.
- **Secretos (solo en GitHub, nunca en el repo):** llave de subida en base64, sus contraseñas y alias, y el JSON de la cuenta de servicio.
- **Repositorio:** requiere hacer push de `main` y `release/0.1.0` al remoto `everitosan/kapitaly` (público).
- **Usuario:** pasos manuales en Play Console y Google Cloud, descritos en la guía.
