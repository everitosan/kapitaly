/**
 * Geometría del ícono del acceso directo "Nuevo gasto" (design/acceso directo expenses.png), en el
 * lienzo de 108 × 108 de los íconos adaptativos de Android: se ven los 72 del centro y la zona
 * segura es un círculo de radio 33 alrededor de (54, 54).
 *
 * `plugins/withAndroidShortcuts.js` (CommonJS, fuera de src) replica estos valores para generar los
 * recursos nativos; una prueba comprueba que coincidan.
 */
export const SHORTCUT_ICON = {
  canvas: 108,
  center: 54,
  /** Lado del área visible (el launcher recorta el resto). */
  visible: 72,
  safeRadius: 33,
  background: '#020903',
  /** Degradado vertical de cada círculo, de arriba a abajo. */
  gradient: { top: '#328844', bottom: '#063D12' },
  /** Círculos concéntricos, del mayor al menor (orden de pintado). */
  circleRadii: [33, 27, 20.5],
  wallet: {
    stroke: '#0A3315',
    strokeWidth: 2.38,
    /** Solapa y cuerpo de la cartera. */
    paths: [
      'M44.9,50.5L57.64,44.06A1.82,1.82 0 0 1 60.3,45.74V50.5',
      'M44.9,50.5h15.68a3.92,3.92 0 0 1 3.92,3.92v7.56a3.92,3.92 0 0 1 -3.92,3.92H48.82a3.92,3.92 0 0 1 -3.92,-3.92z',
    ],
    /** Broche: círculo y raya. */
    clasp: { cx: 59.88, cy: 58.2, r: 1.55, strokeWidth: 1.1, line: 'M59.88,56.65v3.1' },
  },
} as const;

/** Caja que ocupa la cartera dentro del lienzo, para comprobar que cabe en la zona segura. */
export const WALLET_BOUNDS = { minX: 44.9, maxX: 64.5, minY: 44.06, maxY: 66.4 } as const;
