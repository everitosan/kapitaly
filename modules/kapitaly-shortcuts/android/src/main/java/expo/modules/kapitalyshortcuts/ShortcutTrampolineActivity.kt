package expo.modules.kapitalyshortcuts

import android.app.Activity
import android.content.Intent
import android.os.Bundle

/**
 * Recibe el atajo "Nuevo gasto" y reenvía su enlace a la actividad principal de la app sin
 * destruirla: si ya está abierta, la trae al frente y le llega por onNewIntent (expo-router navega
 * encima de lo que había); si no, arranca en frío como siempre. Se cierra sin animación.
 */
class ShortcutTrampolineActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val target = packageManager.getLaunchIntentForPackage(packageName)?.component
    val uri = intent?.data
    if (target != null && uri != null && uri.scheme == SCHEME) {
      startActivity(
        Intent(Intent.ACTION_VIEW, uri)
          .setComponent(target)
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
      )
    }
    finish()
    @Suppress("DEPRECATION")
    overridePendingTransition(0, 0)
  }

  companion object {
    /** Solo se reenvían enlaces de la app (los del atajo). */
    const val SCHEME = "kapitalyexpenses"
  }
}
