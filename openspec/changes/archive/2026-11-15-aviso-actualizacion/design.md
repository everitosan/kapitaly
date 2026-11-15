# Design

## Context

Ver `proposal.md` y `specs/app-updates/spec.md`. La app no tiene servidor ni hace llamadas de red. Las betas se publican en la pista `internal` de Google Play por el workflow de GitHub Actions. Ya existe el módulo nativo local `modules/kapitaly-shortcuts` (Kotlin, Expo Modules) con su `build.gradle` y manifiesto.

**Play In-App Updates:** la librería `com.google.android.play:app-update` se comunica por IPC con la app de Play Store del teléfono. Play Store conoce la cuenta, la pista del usuario, la versión disponible y si ella instaló la app. Por eso solo responde para instalaciones de Play.

## Goals / Non-Goals

**Goals:** detectar, descargar en segundo plano e instalar con el flujo flexible; un respaldo a Play Store; lógica de estados probada en JS.

**Non-Goals:** el flujo inmediato (bloqueante), prioridades de actualización (`updatePriority`), días de antigüedad e iOS.

## Decisions

### 1. Funciones nativas en el módulo local

En `modules/kapitaly-shortcuts` (ya es el módulo nativo de la app; se puede renombrar después si crece) se agregan:

| Función | Qué hace |
|---|---|
| `checkUpdate(): Promise<UpdateInfo>` | `AppUpdateManager.appUpdateInfo` → `{ available, downloaded, availableVersionCode }`. Ante error (no instalada desde Play, Play desactualizado) responde `{ available: false }` |
| `startFlexibleUpdate(): Promise<'started' \| 'canceled' \| 'failed'>` | `startUpdateFlow(info, activity, AppUpdateOptions.newBuilder(FLEXIBLE))` |
| `completeUpdate()` | `AppUpdateManager.completeUpdate()`: instala y reinicia |
| evento `onUpdateProgress` | `InstallStateUpdatedListener` → `{ status: 'downloading' \| 'downloaded' \| 'failed' \| 'canceled', bytesDownloaded, totalBytes }` |

La dependencia `com.google.android.play:app-update` (versión fijada) va en el `build.gradle` del módulo. El nombre legible de la versión no viene en `AppUpdateInfo` (solo el `versionCode`). La tarjeta muestra la versión solo si se puede derivar del `versionCode` con la fórmula de `scripts/beta-version.js` (`X·1e6 + Y·1e4 + Z·100 + N`, donde 99 es la estable). Si no, solo dice "Nueva versión disponible". Las firmas exactas se revisan en la documentación de Play Core antes de escribir.

### 2. Estados en JS (puro)

`src/domain/appUpdate.ts`:

```
type UpdateState =
  | { kind: 'none' }
  | { kind: 'available'; versionName: string | null }
  | { kind: 'downloading'; percent: number }
  | { kind: 'downloaded' }
reduce(state, event) -> state     // check, progress, canceled, failed, dismissed
versionNameFromCode(code) -> '0.1.0-beta.7' | '0.1.0' | null
```

Se prueba sin nativo: transiciones, porcentaje redondeado y el cálculo del nombre a partir del código.

### 3. Hook y tarjeta

- **`useAppUpdate()`** (`src/features/updates/`): consulta al montar y al volver a primer plano (`AppState`). Escucha el progreso y expone `state`, `update()`, `restart()` y `dismiss()`. `dismissed` vive en memoria, así que se pierde al cerrar la app, como pide el spec.
- **`update()`:** llama a `startFlexibleUpdate()`. Si devuelve `failed`, o la llamada lanza, abre `market://details?id=com.kapitaly.expenses` con `Linking`, y si eso falla, `https://play.google.com/store/apps/details?id=com.kapitaly.expenses`. Si devuelve `canceled`, regresa a `available`.
- **`UpdateBanner`:** una tarjeta debajo de la barra superior del balance y arriba del mes, en el estilo A-1 (fondo `card` y botón principal pequeño). Los textos son los del spec. Sin [x] en `downloaded`.
- **iOS, web y Expo Go:** el módulo nativo no existe (`requireOptionalNativeModule` devuelve `null`) y el hook queda en `none`.

## Risks / Trade-offs

- [In-app updates no responde con la app instalada fuera de Play] → es lo esperado; en Expo no hay aviso. La prueba real necesita dos betas seguidas desde Play.
- [Play tarda en ofrecer la versión recién publicada] → el aviso sale cuando Play ya la ofrece; no se fuerza nada.
- [El usuario no reinicia] → Play instala la actualización descargada en el siguiente cierre de la app; al abrir, el estado ya es `none`.
- [Cambios de API en Play Core] → la versión de la dependencia queda fijada, y las funciones nativas son pocas y aisladas.

## Migration Plan

Sin datos. La primera beta que lo trae no puede avisar de sí misma: el aviso se ve a partir de la beta siguiente. Para revertir, basta con regresar el commit.
