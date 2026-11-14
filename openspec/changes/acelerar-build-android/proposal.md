# Proposal

## Why

Cada beta de Android tarda ~18 minutos en GitHub Actions y siempre arranca en frío. Las cachés que guarda el workflow nunca se reutilizan: GitHub solo deja leer las cachés del mismo ref o de la rama por defecto, y cada tag es un ref nuevo. Así se acumulan ~1.7 GB por beta que nadie lee (5.7 GB de 10 GB hoy). Además, la firma corre dentro de Gradle, y por eso se desactivó el build cache. Ahora que la beta incluye `armeabi-v7a` para celulares de 32 bits, la parte de C++ (~9 de los 14 minutos de Gradle) se hace dos veces en cada corrida.

## What Changes

- **Cachés que sí se reutilizan, por serie:** el push del tag `v*-beta.*` ya no compila. Solo valida el tag y lanza la compilación sobre la rama `release/X.Y.0`, pasándole el tag. Así las cachés de npm, de las dependencias de Gradle, de ccache (C++) y del build cache de Gradle quedan en la rama de la serie, y todas sus betas las comparten. `main` no se toca. Se borran las cachés que quedaron guardadas en los tags.
- **Jobs en paralelo:** las pruebas, el typecheck y el lint corren en un job, y la compilación en otro, al mismo tiempo. La firma y la publicación solo empiezan si los dos terminan bien.
- **Firma separada del build:** Gradle produce un `.aab` sin firmar en un job que no tiene acceso a ningún secreto. Otro job lo firma con `jarsigner` usando la llave de subida, verifica el certificado y lo publica. El plugin `withAndroidReleaseSigning` deja de exigir credenciales para compilar. La protección contra una firma debug o una firma ausente pasa al job de firma.
- **C++ reutilizable:** se compila con ccache, para que el código nativo de las librerías (expo-modules-core, reanimated, worklets, appmodules) no se recompile mientras no cambie el lockfile.
- **Arquitecturas:** se mantiene un solo `.aab` con `arm64-v8a` y `armeabi-v7a`.
- **Documentación:** `docs/android-beta.md` se actualiza con el nuevo flujo y con tiempos medidos, sin el "~27 minutos" actual.

Meta: ~7-9 minutos por beta cuando la caché está caliente. Cuando cambie el lockfile, el tiempo será parecido al de hoy.

**Fuera de alcance:** dividir la compilación por ABI en varios runners o subir varios `.aab`, runners de pago o self-hosted, EAS, iOS, y cambios a la fórmula de `versionCode`.

## Capabilities

### New Capabilities
<!-- Ninguna -->

### Modified Capabilities
- `android-beta-release`: las verificaciones se exigen antes de firmar y publicar, ya no antes de compilar. La compilación no tiene acceso a los secretos de firma y produce un `.aab` sin firmar, que se firma y verifica en un paso aparte. Se agregan requisitos de arquitecturas soportadas y de reutilizar compilaciones entre betas.

## Impact

- **Código:** `.github/workflows/android-beta.yml` se reestructura en jobs; nuevo workflow de calentamiento de cachés en `main`; `plugins/withAndroidReleaseSigning.js` y sus pruebas; se reutiliza `scripts/VerifyAndroidBundle.java`; posiblemente un script de firma en `scripts/`.
- **Seguridad:** los secretos de firma y de Play quedan limitados al job de firma y publicación. Las cachés y el artifact intermedio nunca contienen llaves ni el `.aab` firmado.
- **Servicios:** sigue siendo solo GitHub Actions. El `.aab` sin firmar pasa entre jobs como artifact de corta retención.
- **Operación:** una limpieza manual, por única vez, de las cachés de tags existentes.
