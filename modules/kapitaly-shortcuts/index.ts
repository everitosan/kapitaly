import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

/** Respuesta de Play al consultar (misma forma que `UpdateCheck` en src/domain/appUpdate.ts). */
export interface NativeUpdateCheck {
  status: 'none' | 'available' | 'downloading' | 'downloaded';
  availableVersionCode: number | null;
  bytesDownloaded?: number;
  totalBytes?: number;
}

export interface NativeUpdateProgress {
  status: 'downloading' | 'downloaded' | 'canceled' | 'failed' | 'installed' | 'other';
  bytesDownloaded: number;
  totalBytes: number;
}

export type FlexibleUpdateResult = 'started' | 'canceled' | 'failed';

interface KapitalyShortcutsNative {
  isPinSupported(): boolean;
  requestPinNewExpense(uri: string): boolean;
  checkUpdate(): Promise<NativeUpdateCheck>;
  startFlexibleUpdate(): Promise<FlexibleUpdateResult>;
  completeUpdate(): void;
  addListener(
    event: 'onUpdateProgress',
    listener: (progress: NativeUpdateProgress) => void,
  ): { remove(): void };
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

const NO_UPDATE: NativeUpdateCheck = { status: 'none', availableVersionCode: null };

/** Si Play tiene una versión más nueva para este usuario. Sin módulo o fuera de Play: no hay. */
export async function checkUpdate(): Promise<NativeUpdateCheck> {
  try {
    return (await native?.checkUpdate()) ?? NO_UPDATE;
  } catch {
    return NO_UPDATE;
  }
}

/** Inicia el flujo flexible de Play (su confirmación y la descarga en segundo plano). */
export async function startFlexibleUpdate(): Promise<FlexibleUpdateResult> {
  if (!native) return 'failed';
  try {
    return await native.startFlexibleUpdate();
  } catch {
    return 'failed';
  }
}

/** Instala la versión descargada y reinicia la app. */
export function completeUpdate(): void {
  try {
    native?.completeUpdate();
  } catch {
    // Sin módulo o sin descarga: no hay nada que instalar.
  }
}

/** Progreso de la descarga; devuelve la función para dejar de escuchar. */
export function onUpdateProgress(listener: (progress: NativeUpdateProgress) => void): () => void {
  const subscription = native?.addListener('onUpdateProgress', listener);
  return () => subscription?.remove();
}
