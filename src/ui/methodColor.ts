import { INSTITUTION_CATALOG } from '@/data/institutions/catalog';
import { effectiveColor } from '@/domain/institution';
import type { PaymentMethod } from '@/domain/paymentMethod';

import type { Gradient, Theme } from './theme';

/** Degradado con el que se pinta un método: override de paleta (según el tema) o duotono de su institución. */
export function methodGradient(
  method: Pick<PaymentMethod, 'color' | 'institutionId'> | null,
  theme: Theme,
): Gradient {
  if (!method) return theme.palette.ink;
  const c = effectiveColor(method, INSTITUTION_CATALOG);
  if (c.kind === 'palette') return theme.palette[c.key];
  return { from: c.duotone.from, to: c.duotone.to, text: c.duotone.text };
}
