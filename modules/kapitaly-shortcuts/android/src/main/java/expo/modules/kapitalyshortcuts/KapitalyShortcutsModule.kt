package expo.modules.kapitalyshortcuts

import android.app.Activity
import android.content.Intent
import android.net.Uri
import androidx.core.content.pm.ShortcutInfoCompat
import androidx.core.content.pm.ShortcutManagerCompat
import androidx.core.graphics.drawable.IconCompat
import com.google.android.play.core.appupdate.AppUpdateInfo
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.InstallStateUpdatedListener
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.InstallStatus
import com.google.android.play.core.install.model.UpdateAvailability
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Funciones nativas de la app:
 * - Acceso directo "Nuevo gasto": pide a Android fijarlo en la pantalla de inicio. El ícono, los
 *   textos y el destino son los mismos que el atajo estático de plugins/withAndroidShortcuts.js.
 * - Actualizaciones de Google Play (flujo flexible): consulta si hay versión nueva, inicia la
 *   descarga en segundo plano, avisa el progreso e instala. Solo responde en instalaciones de Play.
 */
class KapitalyShortcutsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("KapitalyShortcuts")

    Events(UPDATE_PROGRESS_EVENT)

    OnStartObserving(UPDATE_PROGRESS_EVENT) { listenForUpdates() }
    OnStopObserving(UPDATE_PROGRESS_EVENT) { stopListeningForUpdates() }
    OnDestroy { stopListeningForUpdates() }

    AsyncFunction("checkUpdate") { promise: Promise ->
      try {
        updateManager.appUpdateInfo
          .addOnSuccessListener { info -> promise.resolve(describe(info)) }
          .addOnFailureListener { promise.resolve(NO_UPDATE) }
      } catch (e: Exception) {
        promise.resolve(NO_UPDATE)
      }
    }

    AsyncFunction("startFlexibleUpdate") { promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.resolve("failed")
        return@AsyncFunction
      }
      try {
        updateManager.appUpdateInfo
          .addOnSuccessListener { info ->
            if (info.updateAvailability() != UpdateAvailability.UPDATE_AVAILABLE ||
              !info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)
            ) {
              promise.resolve("failed")
              return@addOnSuccessListener
            }
            listenForUpdates()
            updateManager
              .startUpdateFlow(info, activity, AppUpdateOptions.defaultOptions(AppUpdateType.FLEXIBLE))
              .addOnSuccessListener { code ->
                promise.resolve(
                  when (code) {
                    Activity.RESULT_OK -> "started"
                    Activity.RESULT_CANCELED -> "canceled"
                    else -> "failed"
                  },
                )
              }
              .addOnFailureListener { promise.resolve("failed") }
          }
          .addOnFailureListener { promise.resolve("failed") }
      } catch (e: Exception) {
        promise.resolve("failed")
      }
    }

    Function("completeUpdate") {
      updateManager.completeUpdate()
      return@Function null
    }

    Function("isPinSupported") {
      return@Function ShortcutManagerCompat.isRequestPinShortcutSupported(context)
    }

    Function("requestPinNewExpense") { uri: String ->
      if (!ShortcutManagerCompat.isRequestPinShortcutSupported(context)) return@Function false
      val res = context.resources
      // A la trampolín, para no destruir la app si ya está abierta (ver ShortcutTrampolineActivity).
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri))
        .setClass(context, ShortcutTrampolineActivity::class.java)
      val shortcut = ShortcutInfoCompat.Builder(context, SHORTCUT_ID)
        .setShortLabel(res.getString(stringId("shortcut_new_expense_short")))
        .setLongLabel(res.getString(stringId("shortcut_new_expense_long")))
        .setIcon(IconCompat.createWithResource(context, drawableId("shortcut_new_expense")))
        .setIntent(intent)
        .build()
      return@Function ShortcutManagerCompat.requestPinShortcut(context, shortcut, null)
    }
  }

  private val context
    get() = requireNotNull(appContext.reactContext)

  private val updateManager: AppUpdateManager by lazy { AppUpdateManagerFactory.create(context) }

  private var updateListener: InstallStateUpdatedListener? = null

  private fun listenForUpdates() {
    if (updateListener != null) return
    val listener = InstallStateUpdatedListener { state ->
      sendEvent(
        UPDATE_PROGRESS_EVENT,
        mapOf(
          "status" to statusName(state.installStatus()),
          "bytesDownloaded" to state.bytesDownloaded().toDouble(),
          "totalBytes" to state.totalBytesToDownload().toDouble(),
        ),
      )
    }
    updateManager.registerListener(listener)
    updateListener = listener
  }

  private fun stopListeningForUpdates() {
    updateListener?.let { updateManager.unregisterListener(it) }
    updateListener = null
  }

  private fun statusName(status: Int) = when (status) {
    InstallStatus.PENDING, InstallStatus.DOWNLOADING -> "downloading"
    InstallStatus.DOWNLOADED -> "downloaded"
    InstallStatus.CANCELED -> "canceled"
    InstallStatus.FAILED -> "failed"
    InstallStatus.INSTALLED -> "installed"
    else -> "other"
  }

  /** Lo que responde Play, en la forma que espera src/domain/appUpdate.ts (`UpdateCheck`). */
  private fun describe(info: AppUpdateInfo): Map<String, Any?> {
    val status = when {
      info.installStatus() == InstallStatus.DOWNLOADED -> "downloaded"
      info.installStatus() == InstallStatus.DOWNLOADING ||
        info.installStatus() == InstallStatus.PENDING -> "downloading"
      info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE &&
        info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE) -> "available"
      else -> "none"
    }
    return mapOf(
      "status" to status,
      "availableVersionCode" to if (status == "none") null else info.availableVersionCode(),
      "bytesDownloaded" to info.bytesDownloaded().toDouble(),
      "totalBytes" to info.totalBytesToDownload().toDouble(),
    )
  }

  // Los recursos los genera el plugin en la app, así que se buscan por nombre.
  private fun stringId(name: String) =
    context.resources.getIdentifier(name, "string", context.packageName)

  private fun drawableId(name: String) =
    context.resources.getIdentifier(name, "drawable", context.packageName)

  companion object {
    const val SHORTCUT_ID = "new-expense"
    const val UPDATE_PROGRESS_EVENT = "onUpdateProgress"
    private val NO_UPDATE = mapOf("status" to "none", "availableVersionCode" to null)
  }
}
