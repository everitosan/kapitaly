/**
 * `?quick=1` lo trae la URL del acceso directo y del atajo "Nuevo gasto"
 * (ver `plugins/withAndroidShortcuts.js`).
 */
export function isQuickLaunch(url: string | null): boolean {
  if (!url) return false;
  return /[?&]quick=1(?:&|#|$)/.test(url);
}

/**
 * El splash se anima solo en un arranque normal: no desde el atajo ni desde una notificación, para
 * que la pantalla destino salga de inmediato, ni con "reducir movimiento" activado.
 */
export function shouldAnimateSplash(
  launchURL: string | null,
  reducedMotion: boolean,
  fromNotification = false,
): boolean {
  return !reducedMotion && !fromNotification && !isQuickLaunch(launchURL);
}
