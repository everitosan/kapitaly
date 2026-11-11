/**
 * Utilidades de color: contraste WCAG y duotono derivado de un color de marca.
 * Puras y sin dependencias, para usarse tanto en el dominio como en las pruebas del tema.
 */

export type Hex = string;

export const DARK_TEXT: Hex = '#141414';
export const WHITE_TEXT: Hex = '#FFFFFF';
export const AA_MIN = 4.5;

function hexToRgb(hex: Hex): [number, number, number] {
  const h = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`Color hex inválido: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
}

export function relativeLuminance(hex: Hex): number {
  const [r, g, b] = hexToRgb(hex).map((v) =>
    v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razón de contraste WCAG entre dos colores (1 a 21). */
export function contrastRatio(a: Hex, b: Hex): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function rgbToHsl([r, g, b]: [number, number, number]): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): Hex {
  const sn = s / 100;
  const ln = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => ln - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return (
    '#' +
    [f(0), f(8), f(4)]
      .map((v) =>
        Math.round(v * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
      .toUpperCase()
  );
}

export interface Duotone {
  from: Hex;
  to: Hex;
  /** Color de texto que cumple AA contra ambos extremos. */
  text: Hex;
}

/** Indica si `text` cumple el contraste mínimo contra ambos extremos del degradado. */
export const meetsAAOnBoth = (text: Hex, from: Hex, to: Hex): boolean =>
  contrastRatio(text, from) >= AA_MIN && contrastRatio(text, to) >= AA_MIN;

/**
 * Convierte un color de marca en un duotono del estilo A-1. El primer tono siempre es el de marca.
 * 1. Segundo tono 12 puntos más oscuro y 12° de giro, con texto blanco.
 * 2. Si no alcanza (marcas claras): segundo tono 10 puntos más claro, con texto oscuro.
 * 3. Último recurso: oscurecer ambos tonos hasta que el blanco cumpla.
 */
export function duotoneFromBase(base: Hex): Duotone {
  const baseHex = base.toUpperCase();
  const [h, s, l] = rgbToHsl(hexToRgb(baseHex));
  const hue = (h + 12) % 360;
  const darker = hslToHex(hue, s, Math.max(6, l - 12));
  const lighter = hslToHex(hue, s, Math.min(94, l + 10));

  if (meetsAAOnBoth(WHITE_TEXT, baseHex, darker))
    return { from: baseHex, to: darker, text: WHITE_TEXT };
  if (meetsAAOnBoth(DARK_TEXT, baseHex, lighter))
    return { from: baseHex, to: lighter, text: DARK_TEXT };
  if (meetsAAOnBoth(DARK_TEXT, baseHex, darker))
    return { from: baseHex, to: darker, text: DARK_TEXT };

  let lightness = l;
  let from = baseHex;
  let to = darker;
  for (let i = 0; i < 30 && !meetsAAOnBoth(WHITE_TEXT, from, to); i++) {
    lightness -= 3;
    from = hslToHex(h, s, Math.max(2, lightness));
    to = hslToHex(hue, s, Math.max(2, lightness - 12));
  }
  return { from, to, text: WHITE_TEXT };
}

/** Texto (blanco u oscuro) con mejor contraste sobre un color sólido. */
export function readableTextOn(bg: Hex): Hex {
  return contrastRatio(WHITE_TEXT, bg) >= contrastRatio(DARK_TEXT, bg) ? WHITE_TEXT : DARK_TEXT;
}
