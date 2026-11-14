/**
 * `?quick=1` lo trae la URL del acceso directo y del atajo "Nuevo gasto"
 * (ver `plugins/withAndroidShortcuts.js`).
 */
export function isQuickLaunch(url: string | null): boolean {
  if (!url) return false;
  return /[?&]quick=1(?:&|#|$)/.test(url);
}

/**
 * El splash se anima solo en un arranque normal: no desde el atajo, para que el formulario salga
 * de inmediato, ni con "reducir movimiento" activado.
 */
export function shouldAnimateSplash(launchURL: string | null, reducedMotion: boolean): boolean {
  return !reducedMotion && !isQuickLaunch(launchURL);
}
