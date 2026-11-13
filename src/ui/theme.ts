/**
 * Tokens del sistema de diseño "A-1 Duotono" (design.md, decisión 9).
 * Referencia visual: design/propose/a-1-duotono.html.
 */
import type { PaletteColorKey } from '@/domain/paymentMethod';

export type ColorSchemeName = 'light' | 'dark';

/** Degradado de dos tonos (135°) con el color de texto que cumple AA sobre ambos extremos. */
export interface Gradient {
  from: string;
  to: string;
  text: string;
}

export type FrequencyKey =
  'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'annual' | 'custom';

export interface ThemeColors {
  bg: string;
  card: string;
  ink: string;
  muted: string;
  line: string;
  switchOff: string;
  /** Texto sobre bloques de color: siempre oscuro, en ambos temas. */
  onBlock: string;
  danger: string;
  /** Superficie translúcida de insignias y píldoras sobre bloques de color. */
  blockOverlay: string;
}

export interface Theme {
  scheme: ColorSchemeName;
  colors: ThemeColors;
  frequency: Record<FrequencyKey, Gradient>;
  totals: { thisMonth: Gradient; average: Gradient };
  /** Paleta de métodos de pago (override de color). */
  palette: Record<PaletteColorKey, Gradient>;
  /** Botón principal y opción activa del control segmentado. */
  primary: Gradient;
  /** Paleta categórica de gráficas (8 tonos) y el gris de "Otro". */
  chart: { series: readonly string[]; other: string };
  spacing: typeof spacing;
  radii: typeof radii;
  type: typeof type;
}

const ON_BLOCK = '#141414';
const WHITE = '#FFFFFF';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  screen: 20,
  rowGap: 10,
} as const;

export const radii = { total: 30, card: 24, row: 22, field: 16, pill: 999 } as const;

export const type = {
  total: { fontSize: 46, fontWeight: '800', letterSpacing: -1.4 },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  body: { fontSize: 17, fontWeight: '700' },
  secondary: { fontSize: 13, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
} as const;

const g = (from: string, to: string, text = ON_BLOCK): Gradient => ({ from, to, text });

const lightFrequency: Record<FrequencyKey, Gradient> = {
  monthly: g('#E6F87C', '#9EE36A'),
  bimonthly: g('#C4E6FF', '#82B4FF'),
  quarterly: g('#E1D1FF', '#A98BFF'),
  semiannual: g('#FFD9AE', '#FF9E78'),
  annual: g('#FFC9E0', '#FF7FB2'),
  custom: g('#BFF4DF', '#6FD7B5'),
};

const darkFrequency: Record<FrequencyKey, Gradient> = {
  monthly: g('#D9F06A', '#86D457'),
  bimonthly: g('#AFD9FF', '#6C9EF5'),
  quarterly: g('#D2BFFF', '#9476F5'),
  semiannual: g('#FFCB98', '#F98A63'),
  annual: g('#FFB8D6', '#F56CA2'),
  custom: g('#A9EDD3', '#57C7A2'),
};

const paletteFrom = (
  f: Record<FrequencyKey, Gradient>,
  cobalt: Gradient,
  violet: Gradient,
  ink: Gradient,
): Record<PaletteColorKey, Gradient> => ({
  cobalt,
  violet,
  ink,
  lime: f.monthly,
  sky: f.bimonthly,
  lilac: f.quarterly,
  peach: f.semiannual,
  pink: f.annual,
  mint: f.custom,
});

export const lightTheme: Theme = {
  scheme: 'light',
  colors: {
    bg: '#F4F1EA',
    card: '#FFFFFF',
    ink: '#141414',
    muted: '#6E695F',
    line: '#E4DFD3',
    switchOff: '#D8D2C5',
    onBlock: ON_BLOCK,
    danger: '#C41E33',
    blockOverlay: 'rgba(255,255,255,0.55)',
  },
  frequency: lightFrequency,
  totals: { thisMonth: g('#2B4BF2', '#7B3CF0', WHITE), average: g('#FFD45C', '#FF9A3C') },
  palette: paletteFrom(
    lightFrequency,
    g('#2B4BF2', '#7B3CF0', WHITE),
    g('#7C4DEB', '#5B21B6', WHITE),
    g('#3A3A3F', '#121214', WHITE),
  ),
  primary: g('#2A2A2A', '#141414', '#F4F1EA'),
  chart: {
    series: [
      '#9EE36A',
      '#82B4FF',
      '#A98BFF',
      '#FF9E78',
      '#FF7FB2',
      '#6FD7B5',
      '#FFC93C',
      '#2B4BF2',
    ],
    other: '#B8B2A6',
  },
  spacing,
  radii,
  type,
};

export const darkTheme: Theme = {
  scheme: 'dark',
  colors: {
    bg: '#121110',
    card: '#1E1D1A',
    ink: '#F4F1EA',
    muted: '#9C968A',
    line: '#2E2C28',
    switchOff: '#3A3833',
    onBlock: ON_BLOCK,
    danger: '#FF6B6B',
    blockOverlay: 'rgba(255,255,255,0.45)',
  },
  frequency: darkFrequency,
  totals: { thisMonth: g('#3354FF', '#8344F5', WHITE), average: g('#FFD45C', '#FF9A3C') },
  palette: paletteFrom(
    darkFrequency,
    g('#3354FF', '#8344F5', WHITE),
    g('#7C4DEB', '#6A2FD0', WHITE),
    g('#4A4A50', '#26262A', WHITE),
  ),
  primary: g('#FFFFFF', '#E4DFD3', ON_BLOCK),
  chart: {
    series: [
      '#86D457',
      '#6C9EF5',
      '#9476F5',
      '#F98A63',
      '#F56CA2',
      '#57C7A2',
      '#F2BC2E',
      '#5A78FF',
    ],
    other: '#6E695F',
  },
  spacing,
  radii,
  type,
};

export const themes: Record<ColorSchemeName, Theme> = { light: lightTheme, dark: darkTheme };

/** Color de frecuencia según los meses del intervalo (1, 2, 3, 6, 12 u otro). */
export function frequencyKeyForMonths(months: number): FrequencyKey {
  switch (months) {
    case 1:
      return 'monthly';
    case 2:
      return 'bimonthly';
    case 3:
      return 'quarterly';
    case 6:
      return 'semiannual';
    case 12:
      return 'annual';
    default:
      return 'custom';
  }
}

export const PALETTE_NAMES: Record<PaletteColorKey, string> = {
  cobalt: 'Cobalto',
  violet: 'Violeta',
  ink: 'Tinta',
  lime: 'Lima',
  sky: 'Cielo',
  lilac: 'Lila',
  peach: 'Durazno',
  pink: 'Rosa',
  mint: 'Menta',
};
