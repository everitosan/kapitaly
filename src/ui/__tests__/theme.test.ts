import { AA_MIN, contrastRatio } from '@/domain/color';
import { PALETTE_COLOR_KEYS } from '@/domain/paymentMethod';

import { frequencyKeyForMonths, themes, type Gradient } from '../theme';

const both = (gr: Gradient) => [contrastRatio(gr.text, gr.from), contrastRatio(gr.text, gr.to)];

describe.each(Object.values(themes))('tema $scheme', (theme) => {
  it.each(Object.entries(theme.frequency))('frecuencia %s cumple AA en ambos extremos', (_, gr) => {
    for (const c of both(gr)) expect(c).toBeGreaterThanOrEqual(AA_MIN);
  });

  it.each(Object.entries(theme.totals))('total %s cumple AA en ambos extremos', (_, gr) => {
    for (const c of both(gr)) expect(c).toBeGreaterThanOrEqual(AA_MIN);
  });

  it.each(PALETTE_COLOR_KEYS)('color de método %s cumple AA en ambos extremos', (key) => {
    for (const c of both(theme.palette[key])) expect(c).toBeGreaterThanOrEqual(AA_MIN);
  });

  it('botón principal y textos neutros cumplen AA', () => {
    for (const c of both(theme.primary)) expect(c).toBeGreaterThanOrEqual(AA_MIN);
    const { ink, muted, bg, card, danger } = theme.colors;
    for (const surface of [bg, card]) {
      expect(contrastRatio(ink, surface)).toBeGreaterThanOrEqual(AA_MIN);
      expect(contrastRatio(muted, surface)).toBeGreaterThanOrEqual(AA_MIN);
      expect(contrastRatio(danger, surface)).toBeGreaterThanOrEqual(AA_MIN);
    }
  });

  it('el texto sobre bloques es siempre oscuro', () => {
    expect(theme.colors.onBlock).toBe('#141414');
  });
});

it('asigna color por meses del intervalo', () => {
  expect([1, 2, 3, 6, 12, 4].map(frequencyKeyForMonths)).toEqual([
    'monthly',
    'bimonthly',
    'quarterly',
    'semiannual',
    'annual',
    'custom',
  ]);
});
