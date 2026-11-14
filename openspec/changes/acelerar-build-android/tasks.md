# Tasks

## 1. Prueba de despacho y ccache

- [ ] 1.1 En una rama de prueba con `publish=false`, comprobar que un job con `actions: write` y `GITHUB_TOKEN` puede ejecutar `gh workflow run <build>.yml --ref release/X.Y.0` aunque el workflow no esté en `main`. Verificación: aparece una corrida `workflow_dispatch` con `head_branch = release/X.Y.0`. Si falla, anotar el plan B (PAT de despacho) en `design.md` antes de seguir.
- [ ] 1.2 En esa misma prueba, compilar dos veces seguidas con ccache (`CMAKE_*_COMPILER_LAUNCHER`, `CCACHE_BASEDIR`, `CCACHE_SLOPPINESS`) y la caché guardada en el ref de la rama. Verificación: `ccache -s` de la segunda corrida muestra aciertos en expo-modules-core, reanimated, worklets y appmodules, y el paso de Gradle baja de forma medible. Anotar los tiempos en `design.md`. Si las librerías no usan el launcher, aplicar el plan B del diseño y volver a medir.

## 2. Firma fuera de Gradle

- [ ] 2.1 Cambiar `plugins/withAndroidReleaseSigning.js`: sin ninguna variable, release queda sin `signingConfig` y no falla; con las cuatro variables, firma como hoy; con solo algunas, falla igual que hoy. Verificación: las pruebas en `plugins/__tests__` cubren los tres casos y `npm test` pasa.
- [ ] 2.2 Agregar un script de firma en `scripts/` que ejecute `jarsigner` sobre el AAB con las credenciales por entorno o archivo, sin mostrarlas, y que rechace `androiddebugkey`. Después del script se ejecuta `VerifyAndroidBundle.java`. Verificación: pruebas del script (alias debug rechazado, variables ausentes que se reportan solo por nombre) y una firma local con una llave de prueba que pase `VerifyAndroidBundle.java`.

## 3. Workflows

- [ ] 3.1 Reducir `android-beta.yml` (disparado por tag) a: validar con `validate-beta-release.js` y despachar el workflow de build sobre `release/X.Y.0` con `tag` y `publish=true`. Sin secretos ni cachés; `actions: write` solo en ese job. Verificación: `scripts/__tests__/android-beta-workflow.test.js` se actualiza para comprobar triggers, permisos y que no hay secretos.
- [ ] 3.2 Crear el workflow de build (`workflow_dispatch` con `tag` y `publish`) con los jobs `checks`, `build` y `sign-publish`, como en el diseño. Incluye: checkout del commit del tag, revalidación de tag, rama y versión, secretos solo en `sign-publish`, `needs: [checks, build]`, AAB sin firmar con 1 día de retención, AAB firmado con 7 días, concurrencia global sin cancelación, y acciones fijadas a SHA. Verificación: pruebas del workflow que revisan que `checks` y `build` no tienen secretos, que `sign-publish` depende de ambos y que la publicación solo ocurre con `publish=true`.
- [ ] 3.3 Configurar las cachés en `build`: npm, deps de Gradle, `--build-cache` y ccache, con llaves por lockfile + NDK, restore-keys, guardado por `run_id` y `CCACHE_MAXSIZE`. Instalar del Android SDK solo lo que falte. Verificación: pruebas del workflow comprueban que las cachés están configuradas y que no se usa `--no-build-cache`.
- [ ] 3.4 Ajustar `validate-beta-release.js` para el modo despacho, en el que la corrida está en la rama y el tag llega como entrada, y confirmar que exige que el tag sea ancestro de la rama de la corrida. Verificación: casos nuevos en `validate-beta-release.test.js`, incluido `publish=true` con un tag de otra rama, que debe fallar.

## 4. Documentación

- [ ] 4.1 Actualizar `docs/android-beta.md`: nuevo flujo (el tag despacha y el build corre en la rama), dónde viven las cachés, que la firma va en un job aparte, ejecución manual con `publish=false`, cómo borrar la caché de una serie, y tiempos medidos que reemplacen el "~27 minutos". Verificación: la guía coincide con los workflows de la sección 3.

## 5. Verificación integral

- [ ] 5.1 Lanzar manualmente con `publish=false` sobre `release/0.1.0` y comparar el AAB firmado contra beta.5: paquete `com.kapitaly.expenses`, `versionName` y `versionCode`, ABIs `arm64-v8a` y `armeabi-v7a`, y certificado de subida. Verificación: inspeccionar con `bundletool` o `unzip -l` más `VerifyAndroidBundle.java`.
- [ ] 5.2 Publicar dos betas seguidas por tag en la misma serie. Verificación: las dos aparecen en la pista interna, se pueden instalar desde Play y conservan los datos locales; la segunda tarda ≤ 9 min de punta a punta.
- [ ] 5.3 Borrar las cachés guardadas en `refs/tags/*` con `gh cache delete`. Verificación: `gh api .../actions/caches` ya no lista refs de tags.

## Workflow follow-up

- Archivar el change con `/opsx:archive` cuando las betas por tag funcionen con el nuevo flujo.
