# Design

## Context

Ver `proposal.md` (Why) y el delta de `specs/android-beta-release/spec.md`. Lo que sigue son datos medidos en las corridas `v0.1.0-beta.2` a `beta.5`.

- Total ~18 min. Gradle se lleva 840 s con `arm64-v8a,armeabi-v7a` y 647 s solo con arm64. Otros pasos: `npm ci` ~62 s, SDK ~45 s, tests/tsc/lint ~26 s, subida a Play ~51 s.
- Dentro de Gradle: ~5 min de arranque, Kotlin, JS bundle y R8, y ~9 min de CMake. Lo más lento es `expo-modules-core`, `react-native-reanimated` y `:app` (appmodules), con 1.5 a 2 min cada uno por ABI.
- `setup-java` reporta `gradle cache is not found` en todas las corridas. Las cachés quedan guardadas por tag (`refs/tags/v0.1.0-beta.N`), y GitHub solo deja leer cachés del ref propio o de la rama por defecto.
- `main` solo tiene el commit inicial y, según el flujo de ramas, solo recibe versiones estables. No sirve como scope de caché durante una serie.
- El runner `ubuntu-24.04` ya trae el NDK `27.1.12297006`. RN (`ReactNative-application.cmake`), expo-modules-core (`pch-ccache.cmake`), reanimated y worklets (`-fno-pch-timestamp`) ya vienen preparados para ccache.
- `withAndroidReleaseSigning` hoy falla en cualquier tarea release si no hay credenciales. Esto obliga a tener los secretos dentro del build.

## Goals / Non-Goals

**Goals:** que la segunda beta y las siguientes de una serie reutilicen dependencias y C++, que la compilación no tenga secretos, y que el `.aab` publicado sea igual de válido que hoy (mismo paquete, versión y certificado de subida).

**Non-Goals:** acelerar la primera beta de cada serie, compartir cachés entre series, o cambiar la versión de Gradle, del NDK o de AGP.

## Decisions

### 1. El tag despacha; la compilación corre en la rama de la serie

```
push tag vX.Y.Z-beta.N
   |
   v
[android-beta: trigger]          ref = refs/tags/...   (sin cachés, sin secretos)
   valida tag, rama release/X.Y.0 y versión (validate-beta-release.js)
   gh workflow run android-beta-build.yml --ref release/X.Y.0 -f tag=... -f publish=true
   |
   v
[android-beta-build]             ref = refs/heads/release/X.Y.0   <- scope de cachés
   checks ||  build  -->  sign-publish
```

Las cachés se guardan con el ref de la corrida (`GITHUB_REF`), no con el commit que se compila. Por eso el build despachado sobre `release/X.Y.0` hace checkout del **commit del tag**, no de la punta de la rama, y aun así guarda y lee las cachés de la rama. Las ejecuciones manuales, que generan el AAB sin publicar, usan esta misma entrada sobre la rama, con `publish=false`.

El build vuelve a validar sus entradas: el tag existe, apunta a un ancestro de la rama de la corrida y coincide con la versión. Así, alguien que lo lance a mano con `publish=true` no puede publicar algo que no valida. `GITHUB_TOKEN` sí puede disparar `workflow_dispatch`. El job que despacha necesita `actions: write`, y el resto se queda en `contents: read`.

*Alternativas descartadas:* un workflow en `main`, que rompe "main solo estable"; pasar la caché como artifact del run anterior, que sube y baja 1-2 GB por corrida; y compilar en el push del tag, que es lo de hoy y nunca tiene caché.

### 2. Tres jobs en el build

| Job | Secretos | Cachés | Hace |
|-----|----------|--------|------|
| `checks` | ninguno | npm | `npm ci`, test, typecheck, lint |
| `build` | ninguno | npm, deps Gradle, build cache Gradle, ccache | prebuild, `:app:bundleRelease` sin firmar con `arm64-v8a,armeabi-v7a`, sube el AAB sin firmar como artifact (retención 1 día) |
| `sign-publish` | firma y Play | ninguna | `needs: [checks, build]`, descarga, firma, verifica, guarda el AAB firmado (7 días) y lo publica si `publish=true` |

`checks` y `build` corren en paralelo. Nada se firma ni se publica si alguno de los dos falla. La concurrencia global sin cancelación se mantiene en este workflow, para que no haya dos publicaciones a la vez.

### 3. Firma con jarsigner fuera de Gradle

Un AAB se firma con el esquema JAR (v1), igual que lo hace AGP. `sign-publish` decodifica la llave en `RUNNER_TEMP`, ejecuta `jarsigner` con las contraseñas por entorno o archivo (nunca como argumento visible), rechaza el alias `androiddebugkey` y después corre `scripts/VerifyAndroidBundle.java`, que ya compara el certificado con la llave de subida. La limpieza con `always()` se mantiene.

`withAndroidReleaseSigning` cambia a: si hay las cuatro variables, configura la firma como hoy; si no hay ninguna, deja release **sin `signingConfig`** (en vez de usar la debug de la plantilla) y no falla; si solo hay algunas, falla como hoy. La regla de "nunca publicar sin firma real" pasa al paso 3 y al spec. Se mantienen las pruebas del plugin y se agregan casos nuevos.

*Alternativa descartada:* firmar en Gradle y solo excluir del cache las tareas de firma. Los secretos seguirían en el job que llena las cachés.

### 4. Cachés

- **Llave base:** `runner.os` + hash de `package-lock.json` + versión del NDK. Restore-keys por prefijo (`...-gradle-`), para reutilizar lo que se pueda cuando cambia el lockfile.
- **Deps de Gradle:** `setup-java` con `cache: gradle`, como hoy (ahora sí habrá aciertos).
- **Build cache de Gradle:** se activa (`--build-cache`). Con eso se reutilizan Kotlin, dex y R8. El configuration cache se queda apagado, porque es frágil con plugins de Expo y no lo necesitamos.
- **ccache:** `CMAKE_C_COMPILER_LAUNCHER`/`CMAKE_CXX_COMPILER_LAUNCHER=ccache` por entorno. `CCACHE_BASEDIR=$GITHUB_WORKSPACE`, `CCACHE_SLOPPINESS=pch_defines,time_macros,include_file_mtime,include_file_ctime`, `CCACHE_MAXSIZE` acotado (~2 GB) y `CCACHE_COMPILERCHECK=content`. Se cachea con `actions/cache`, y en cada corrida se guarda con una llave nueva (sufijo `run_id`) para que se acumulen los aciertos.
- **npm:** `setup-node` con `cache: npm`.
- **Android SDK:** el NDK 27.1 ya viene en la imagen. Solo se instalan las piezas que falten, comprobándolo antes de llamar a `sdkmanager`.

### 5. Un solo AAB con dos ABIs

Se mantiene, como dice el spec. No se divide por runner: juntar los `.so` en un solo AAB es frágil, y varios AABs romperían la fórmula de `versionCode`. Con ccache caliente, el segundo ABI cuesta alrededor de un minuto.

## Risks / Trade-offs

- [Algunas librerías ignoran el launcher de CMake por entorno] → la tarea 1 es una prueba que mide aciertos de ccache (`ccache -s`) en dos corridas seguidas. Si falla, se usa un wrapper en `PATH` o `-DCMAKE_CXX_COMPILER_LAUNCHER` por `cppFlags` desde un config plugin.
- [`GITHUB_TOKEN` no puede despachar un workflow que no está en la rama por defecto] → se comprueba en la misma prueba. Si falla, el plan B es un PAT de alcance mínimo guardado como secreto, solo para despachar.
- [Caché envenenada o corrupta] → solo se escribe desde corridas sobre `release/*` disparadas por tag o a mano. Ante errores raros, se borra la caché de la rama y se recompila en frío.
- [El AAB sin firmar viaja entre jobs] → no contiene secretos, la retención es de 1 día y el artifact firmado sigue siendo el único que se publica.
- [Límite de 10 GB de caché] → llaves por serie y `CCACHE_MAXSIZE`. Las series viejas se van por LRU.
- [jarsigner produce una firma distinta a la de AGP] → Play acepta AABs firmados con jarsigner. `VerifyAndroidBundle.java` valida el certificado antes de subir.

## Migration Plan

1. Prueba en una rama `release/*` de prueba o con `publish=false`: despachar desde un tag, compilar dos veces y medir los aciertos de ccache y Gradle.
2. Implementar el workflow de despacho, el de build, el plugin y la documentación. Ejecutar pruebas, lint y typecheck.
3. Probar con un dispatch manual `publish=false` y comparar el AAB contra beta.5: paquete, versión, ABIs y certificado.
4. Publicar la siguiente beta por tag. La segunda beta de la serie debe mostrar la mejora de tiempo.
5. Borrar las cachés que quedaron en `refs/tags/*` (`gh cache delete`).
6. Para revertir: volver al workflow anterior desde git. Las cachés y los tags no afectan lo ya publicado.
