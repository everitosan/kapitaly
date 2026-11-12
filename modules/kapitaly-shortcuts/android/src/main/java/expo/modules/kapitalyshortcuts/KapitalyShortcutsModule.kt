package expo.modules.kapitalyshortcuts

import android.content.Intent
import android.net.Uri
import androidx.core.content.pm.ShortcutInfoCompat
import androidx.core.content.pm.ShortcutManagerCompat
import androidx.core.graphics.drawable.IconCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Pide a Android fijar el acceso directo "Nuevo gasto" en la pantalla de inicio. El ícono, los
 * textos y el destino son los mismos que el atajo estático que genera plugins/withAndroidShortcuts.js.
 */
class KapitalyShortcutsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("KapitalyShortcuts")

    Function("isPinSupported") {
      return@Function ShortcutManagerCompat.isRequestPinShortcutSupported(context)
    }

    Function("requestPinNewExpense") { uri: String ->
      if (!ShortcutManagerCompat.isRequestPinShortcutSupported(context)) return@Function false
      val res = context.resources
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri)).setPackage(context.packageName)
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

  // Los recursos los genera el plugin en la app, así que se buscan por nombre.
  private fun stringId(name: String) =
    context.resources.getIdentifier(name, "string", context.packageName)

  private fun drawableId(name: String) =
    context.resources.getIdentifier(name, "drawable", context.packageName)

  companion object {
    const val SHORTCUT_ID = "new-expense"
  }
}
