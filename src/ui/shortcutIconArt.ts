/**
 * Geometría del ícono del acceso directo "Nuevo gasto" (design/link-expeneses.svg), en el lienzo de
 * 108 × 108 de los íconos adaptativos de Android: se ven los 72 del centro y la zona segura es un
 * círculo de radio 33 alrededor de (54, 54).
 *
 * - Fondo: oscuro de marca y un círculo verde con degradado que cruza los bordes superior e izquierdo
 *   del área visible, dejando una esquina oscura arriba a la izquierda en cualquier forma de launcher.
 * - Frente: la cartera del SVG (sus rutas en coordenadas de 432), escalada dentro de la zona segura.
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
  /** Campo verde: en el SVG de 432, centro (306, 306) y radio 250. */
  field: {
    cx: 76.5,
    cy: 76.5,
    r: 62.5,
    gradient: { top: '#328844', bottom: '#063D12' },
  },
  wallet: {
    stroke: '#0A2F11',
    /**
     * De las coordenadas del SVG (432) al lienzo (108): escala al 52 % alrededor del centro de la
     * cartera (223, 216) y divide entre 4. Punto final = translate + scale · punto.
     */
    transform: { scale: 0.13, translateX: 25.01, translateY: 25.92 },
    paths: [
      {
        d: 'M67.1819 153H275.649C324.785 153 349.353 153 364.618 168.816C379.883 184.633 379.883 210.089 379.883 261V279C379.883 329.911 379.883 355.367 364.618 371.183C349.353 387 324.785 387 275.649 387H171.416C122.279 387 97.7113 387 82.4466 371.183C67.1819 355.367 67.1819 329.911 67.1819 279V153Z',
        strokeWidth: 18,
      },
      {
        d: 'M275.649 152.97V73.9854C275.649 57.9773 263.124 45 247.675 45C243.226 45 238.841 46.0994 234.884 48.2072L80.4248 130.487C72.2935 134.818 67.1819 143.497 67.1819 152.97',
        strokeWidth: 18,
      },
      {
        d: 'M316.051 295.055C326.999 295.055 335.876 285.856 335.876 274.513C335.876 263.17 326.999 253.971 316.051 253.971M316.051 295.055C305.103 295.055 296.226 285.856 296.226 274.513C296.226 263.17 305.103 253.971 316.051 253.971M316.051 295.055V253.971',
        strokeWidth: 8,
      },
    ],
  },
} as const;

/** Caja de la cartera en coordenadas del SVG (432), con medio trazo de margen. */
export const WALLET_SOURCE_BOUNDS = { minX: 58.18, maxX: 388.88, minY: 36, maxY: 396 } as const;
