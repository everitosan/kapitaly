import type { SyncMeta, Validation } from './common';
import { compareCivilDates, isValidCivilDate, type CivilDate } from './date';
import { parseMoneyToCents, type Cents } from './money';
import type { CardVariant } from './paymentMethod';

export type IntervalUnit = 'month' | 'year';

export interface RecurringExpense extends SyncMeta {
  name: string;
  amountCents: Cents;
  intervalUnit: IntervalUnit;
  intervalCount: number;
  /** Fecha de cobro (ancla). */
  anchorDate: CivilDate;
  endDate: CivilDate | null;
  paymentMethodId: string;
  /** Física o digital si el método tiene versión digital; `null` si no aplica. */
  cardVariant: CardVariant | null;
}

export interface RecurringExpenseInput {
  name: string;
  amountCents: Cents;
  intervalUnit: IntervalUnit;
  intervalCount: number;
  anchorDate: CivilDate;
  endDate: CivilDate | null;
  paymentMethodId: string;
  cardVariant: CardVariant | null;
}

/** Meses que dura un intervalo: anual = 12 × count. */
export function monthsPerInterval(unit: IntervalUnit, count: number): number {
  return unit === 'year' ? 12 * count : count;
}

export type FrequencyPresetKey = 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'annual';

export interface FrequencyPreset {
  key: FrequencyPresetKey;
  label: string;
  unit: IntervalUnit;
  count: number;
}

/** Presets de la UI. Anual se guarda como `year,1` para conservar la intención del usuario. */
export const FREQUENCY_PRESETS: readonly FrequencyPreset[] = [
  { key: 'monthly', label: 'Mensual', unit: 'month', count: 1 },
  { key: 'bimonthly', label: 'Bimestral', unit: 'month', count: 2 },
  { key: 'quarterly', label: 'Trimestral', unit: 'month', count: 3 },
  { key: 'semiannual', label: 'Semestral', unit: 'month', count: 6 },
  { key: 'annual', label: 'Anual', unit: 'year', count: 1 },
];

/** Preset que corresponde a una frecuencia guardada, o `custom` ("cada N meses"). 12 meses se muestra como Anual. */
export function presetFor(unit: IntervalUnit, count: number): FrequencyPresetKey | 'custom' {
  const months = monthsPerInterval(unit, count);
  const preset = FREQUENCY_PRESETS.find((p) => monthsPerInterval(p.unit, p.count) === months);
  return preset?.key ?? 'custom';
}

export function frequencyLabel(unit: IntervalUnit, count: number): string {
  const key = presetFor(unit, count);
  if (key !== 'custom') return FREQUENCY_PRESETS.find((p) => p.key === key)!.label;
  return `Cada ${monthsPerInterval(unit, count)} meses`;
}

export type RecurringExpenseField =
  'name' | 'amount' | 'interval' | 'anchorDate' | 'endDate' | 'paymentMethodId';

/** Lo que captura el formulario, antes de validar (el monto llega como texto). */
export interface RecurringExpenseDraft {
  name: string;
  amountText: string;
  intervalUnit: IntervalUnit;
  intervalCount: number;
  anchorDate: CivilDate | null;
  endDate: CivilDate | null;
  paymentMethodId: string | null;
  cardVariant?: CardVariant | null;
}

export interface ExpenseValidationContext {
  isActiveMethod: (methodId: string) => boolean;
  /** Indica si el método tiene versión digital (para normalizar `cardVariant`). */
  methodHasDigital?: (methodId: string) => boolean;
}

/** `null` si el método no tiene digital; si la tiene y no se eligió, "Física". */
export function normalizeCardVariant(
  methodId: string,
  variant: CardVariant | null | undefined,
  ctx: ExpenseValidationContext,
): CardVariant | null {
  if (!ctx.methodHasDigital?.(methodId)) return null;
  return variant === 'digital' ? 'digital' : 'physical';
}

export function validateRecurringExpenseInput(
  draft: RecurringExpenseDraft,
  ctx: ExpenseValidationContext,
): Validation<RecurringExpenseInput, RecurringExpenseField> {
  const errors: Partial<Record<RecurringExpenseField, string>> = {};

  const name = draft.name.trim();
  if (name === '') errors.name = 'required';

  const amount = parseMoneyToCents(draft.amountText);
  if (!amount.ok) errors.amount = amount.error === 'empty' ? 'required' : amount.error;
  else if (amount.cents <= 0) errors.amount = 'not_positive';

  if (
    !Number.isInteger(draft.intervalCount) ||
    draft.intervalCount < 1 ||
    !['month', 'year'].includes(draft.intervalUnit)
  ) {
    errors.interval = 'invalid';
  }

  if (draft.anchorDate === null || draft.anchorDate === '') errors.anchorDate = 'required';
  else if (!isValidCivilDate(draft.anchorDate)) errors.anchorDate = 'invalid';

  if (draft.endDate !== null && draft.endDate !== '') {
    if (!isValidCivilDate(draft.endDate)) errors.endDate = 'invalid';
    else if (
      draft.anchorDate &&
      isValidCivilDate(draft.anchorDate) &&
      compareCivilDates(draft.endDate, draft.anchorDate) < 0
    ) {
      errors.endDate = 'before_anchor';
    }
  }

  if (!draft.paymentMethodId || !ctx.isActiveMethod(draft.paymentMethodId))
    errors.paymentMethodId = 'required';

  if (Object.keys(errors).length > 0 || !amount.ok) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name,
      amountCents: amount.cents,
      intervalUnit: draft.intervalUnit,
      intervalCount: draft.intervalCount,
      anchorDate: draft.anchorDate!,
      endDate: draft.endDate ? draft.endDate : null,
      paymentMethodId: draft.paymentMethodId!,
      cardVariant: normalizeCardVariant(draft.paymentMethodId!, draft.cardVariant, ctx),
    },
  };
}
