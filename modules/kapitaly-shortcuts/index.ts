import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

interface KapitalyShortcutsNative {
  isPinSupported(): boolean;
  requestPinNewExpense(uri: string): boolean;
}

/** `null` en iOS, web y Expo Go: ahí el acceso directo simplemente no se ofrece. */
const native =
  Platform.OS === 'android'
    ? requireOptionalNativeModule<KapitalyShortcutsNative>('KapitalyShortcuts')
    : null;

/** Destino del acceso directo y del atajo del ícono (el mismo que usa el plugin). */
export const NEW_EXPENSE_URI = 'kapitalyexpenses://expense/new?quick=1';

/** Si el dispositivo y su launcher permiten fijar accesos directos. */
export function isPinSupported(): boolean {
  try {
    return native?.isPinSupported() ?? false;
  } catch {
    return false;
  }
}

/** Pide a Android mostrar su confirmación para fijar "Nuevo gasto"; `false` si no pudo. */
export function requestPinNewExpense(): boolean {
  try {
    return native?.requestPinNewExpense(NEW_EXPENSE_URI) ?? false;
  } catch {
    return false;
  }
}
