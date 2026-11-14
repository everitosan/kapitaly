# Betas de Android en Google Play

La compilación ocurre en GitHub Actions con Gradle. No necesitas cuenta de Expo ni EAS. El paquete de Android y el identificador iOS son `com.kapitaly.expenses`. La instalación de Play es nueva: no importa datos de Expo Go ni del paquete anterior `app.kapitaly.expenses`. Todos los datos viven en el teléfono (SQLite); la app no necesita red.

Flujo resumido:

1. Trabajo en `release/X.Y.0`.
2. Tag `vX.Y.Z-beta.N` sobre esa rama → el workflow `Android beta` prueba, compila, firma y publica en la pista **interna**.
3. Los testers reciben la actualización desde Play Store.

## Versiones

La versión base vive en `app.json`. Para `0.1.0`, la rama es `release/0.1.0` y los tags son `v0.1.0-beta.1`, `v0.1.0-beta.2`, etc. Para parches `0.1.Z`, se conserva la rama `release/0.1.0`.

El tag debe tener formato exacto `vX.Y.Z-beta.N`, sin ceros iniciales. N va de 1 a 98; Y y Z de 0 a 99. El código debe ser menor o igual a 2100000000. Se calcula:

```text
versionName = X.Y.Z-beta.N
versionCode = X * 1000000 + Y * 10000 + Z * 100 + N
```

Los últimos dígitos 99 quedan reservados para una futura versión estable. Este workflow solo distribuye betas.

```bash
node scripts/beta-version.js v0.1.0-beta.2
```

Resultado con base `0.1.0`: `versionName` = `0.1.0-beta.2`, `versionCode` = `10002`. El tag debe coincidir con la versión base y apuntar a un commit contenido en la rama remota release correspondiente. No muevas ni reutilices tags publicados; cada beta siguiente necesita un código mayor al aceptado por Play.

Historial: `0.1.0-beta.1` (código 10001) se compiló localmente y se subió a mano. La primera beta del workflow es `v0.1.0-beta.2`.

## Herramientas que usa el workflow

Fijadas en `.github/workflows/android-beta.yml` y comprobadas por `scripts/__tests__/android-beta-workflow.test.js`:

| Pieza | Versión |
| --- | --- |
| Runner | `ubuntu-24.04` |
| Node | 24.11.0 (`npm ci`) |
| JDK | Temurin 21.0.13+9 |
| Android SDK | `platforms;android-37.0`, `build-tools;37.0.0`, `ndk;27.1.12297006`, `cmake;3.22.1` |
| Arquitecturas | `arm64-v8a` y `armeabi-v7a` (incluye celulares de 32 bits; sin emuladores x86) |
| Caché | dependencias de Gradle (`setup-java`, llave `package-lock.json`); sin build cache ni configuration cache |
| Acciones | fijadas por SHA completo (checkout v7, setup-node v7, setup-java v6, upload-artifact v7, upload-google-play v1.1.5) |

Al subir de SDK de Expo, revisa `node_modules/react-native/gradle/libs.versions.toml` (compileSdk, buildTools, ndkVersion) y actualiza la tabla y el workflow.

Las carpetas `android/` e `ios/` se generan con `npx expo prebuild` y están ignoradas por git; la firma se inyecta con `plugins/withAndroidReleaseSigning.js`. No las edites a mano.

## Llave de subida

Play App Signing guarda la llave final de la app; tú solo tienes la **llave de subida**, con la que firmas cada AAB. Si se pierde, Play permite restablecerla desde *Configuración de la app → Integridad de la app*, pero tarda días: respáldala.

La llave actual y sus contraseñas están en `ignore/deploy/` (ignorado por git):

- `kapitaly-upload.jks`
- `signing.env.local` con `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` y `ANDROID_KEY_PASSWORD`

Deja esos archivos solo legibles por ti y guarda una copia fuera de la computadora (por ejemplo, en tu gestor de contraseñas):

```bash
chmod 600 ignore/deploy/*
```

Para crear una llave nueva (solo si empiezas de cero o restableces la de subida):

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore ignore/deploy/kapitaly-upload.jks \
  -alias kapitaly-upload -keyalg RSA -keysize 4096 -validity 10000
```

## Secretos en GitHub

En el repo: *Settings → Secrets and variables → Actions*. Son secretos de repositorio:

| Secreto | Contenido | Cuándo se usa |
| --- | --- | --- |
| `ANDROID_KEYSTORE_BASE64` | `kapitaly-upload.jks` en base64 | siempre |
| `ANDROID_KEYSTORE_PASSWORD` | contraseña del keystore | siempre |
| `ANDROID_KEY_ALIAS` | alias de la llave | siempre |
| `ANDROID_KEY_PASSWORD` | contraseña de la llave | siempre |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | JSON de la cuenta de servicio | solo al publicar con tag |

Con `gh`, desde la raíz del repo (los valores no se imprimen ni quedan en el historial):

```bash
(
  source ignore/deploy/signing.env.local
  base64 -w0 ignore/deploy/kapitaly-upload.jks | gh secret set ANDROID_KEYSTORE_BASE64
  printf '%s' "$ANDROID_KEYSTORE_PASSWORD" | gh secret set ANDROID_KEYSTORE_PASSWORD
  printf '%s' "$ANDROID_KEY_ALIAS"         | gh secret set ANDROID_KEY_ALIAS
  printf '%s' "$ANDROID_KEY_PASSWORD"      | gh secret set ANDROID_KEY_PASSWORD
)
gh secret set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON < ignore/deploy/google-play.json
gh secret list
```

El workflow valida que existan antes de compilar y solo muestra el nombre del que falta. GitHub enmascara los valores en los logs; los archivos temporales (`$RUNNER_TEMP/kapitaly-signing`, permisos 600) se borran al final aunque el job falle. Solo se cachean las dependencias descargadas de Gradle; el build cache y el configuration cache están desactivados, así que nada de la firma ni el AAB quedan en cachés.

Se compilan `arm64-v8a` y `armeabi-v7a` para que la beta llegue también a celulares de 32 bits. El build tarda ~27 minutos; con solo `arm64-v8a` baja a ~10, pero Play no ofrece la app a equipos de 32 bits.

## Cuenta de servicio de Google Play

Sirve cualquier proyecto de Google Cloud; se recomienda uno propio de la suite (por ejemplo `kapitaly`) para que la cuenta y la API no se mezclen con otros proyectos. Una sola cuenta de servicio puede publicar las demás apps de la suite: los permisos se dan por app en Play Console. La API no tiene costo.

1. En [Google Cloud Console](https://console.cloud.google.com) crea el proyecto y habilita **Google Play Android Developer API**.
2. En *IAM y administración → Cuentas de servicio* crea `play-publisher` sin roles de Cloud. En *Claves → Agregar clave → JSON* descarga la clave y guárdala como `ignore/deploy/google-play.json`.
3. En Play Console: *Usuarios y permisos* es un menú de la **cuenta**, no de la app; sal a *Todas las apps* o entra directo a <https://play.google.com/console/users-and-permissions>. Solo lo ven el propietario y los administradores. Ahí, *Invitar a nuevos usuarios*, pega el correo `…@….iam.gserviceaccount.com` y, en *Permisos de la app*, agrega Kapitaly Expenses con solo **Ver la información de la app (solo lectura)** y **Lanzar apps a los segmentos de pruebas**. Nada de administrador, producción ni permisos de cuenta.
4. Carga el JSON como `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`.

Los permisos de una cuenta nueva pueden tardar en propagarse. Si la primera publicación falla con error de permisos, espera y vuelve a ejecutar el job.

## Primera carga y testers (ya hecho para 0.1.0-beta.1)

La API de Play no acepta la primera versión de una app nueva; esa se sube a mano:

1. Crear la app en Play Console con el paquete `com.kapitaly.expenses`.
2. *Pruebas → Prueba interna*: crear la lista de testers (correos de cuentas Google) y subir el AAB firmado con la llave de subida. Así queda registrada en Play App Signing.
3. Completar lo que Play pida antes de distribuir (acceso a la app, anuncios, clasificación de contenido, público objetivo, seguridad de los datos). Para *Seguridad de los datos*, revisa dependencias y permisos de la versión que publicas antes de declarar que no recopilas datos.
4. Compartir el enlace de participación con los testers e instalar desde Play.

Compilación local equivalente (respaldo si GitHub no está disponible):

```bash
(
  source ignore/deploy/signing.env.local
  export ANDROID_KEYSTORE_PATH="$PWD/ignore/deploy/kapitaly-upload.jks" KAPITALY_BETA_TAG=v0.1.0-beta.2
  npx expo prebuild --platform android --no-install --clean
  cd android && ./gradlew :app:bundleRelease
)
# AAB: android/app/build/outputs/bundle/release/app-release.aab
```

## Compilar sin publicar (manual)

GitHub solo muestra *Run workflow* cuando el archivo del workflow existe en la **rama por defecto** (`main`). La ejecución sí corre con el código de la rama elegida.

1. *Actions → Android beta → Run workflow*.
2. Rama: `release/0.1.0`; versión sin `v`, por ejemplo `0.1.0-beta.2`.
3. Al terminar, descarga el artefacto `android-0.1.0-beta.2` desde el resumen de la ejecución (dura 7 días). Contiene el AAB firmado; no se sube nada a Play ni se usa la credencial de Play.

Desde la terminal:

```bash
gh workflow run android-beta.yml --ref release/0.1.0 -f version=0.1.0-beta.2
gh run download --name android-0.1.0-beta.2
```

## Publicar una beta (tag)

```bash
git switch release/0.1.0 && git pull
git tag -a v0.1.0-beta.2 -m "Beta 0.1.0-beta.2"
git push origin release/0.1.0 v0.1.0-beta.2
```

El workflow valida tag, versión base y que el commit esté en `origin/release/0.1.0`; corre pruebas, typecheck y lint; compila, verifica que todo el AAB esté firmado con la llave de subida y lo publica en la pista interna. Si algo falla, no publica. Los tags estables (`v0.1.0`) no lo disparan. Las ejecuciones se encolan: nunca se cancelan entre sí.

## Problemas comunes

- **"Version code N has already been used"**: Play ya tiene ese código. No muevas el tag: crea el siguiente (`beta.N+1`).
- **Tag creado fuera de la rama release**: el workflow falla con "no pertenece a la rama remota release". Borra el tag sin publicar (`git push origin :refs/tags/vX.Y.Z-beta.N`), sube el commit a la rama release y vuelve a etiquetar.
- **"La versión del tag no coincide con la versión de app.json"**: actualiza `expo.version` o usa el tag correcto.
- **Firma rechazada por Play**: el AAB no se firmó con la llave de subida registrada; revisa los secretos de firma.
