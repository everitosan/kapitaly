import type { SyncMeta, Validation } from './common';
import { isValidCivilDate, type CivilDate } from './date';
import { parseMoneyToCents, type Cents } from './money';
import type { CardVariant } from './paymentMethod';
import { normalizeCardVariant, type ExpenseValidationContext } from './recurringExpense';

export interface OneOffExpense extends SyncMeta {
  /** Descripción libre (no es un catálogo). */
  description: string;
  amountCents: Cents;
  date: CivilDate;
  paymentMethodId: string;
  /** Física o digital si el método tiene versión digital; `null` si no aplica. */
  cardVariant: CardVariant | null;
  /** Si suma al usado de una tarjeta de crédito; falso = ya venía en el saldo inicial. */
  addsToCardBalance: boolean;
}

export interface OneOffExpenseInput {
  description: string;
  amountCents: Cents;
  date: CivilDate;
  paymentMethodId: string;
  cardVariant: CardVariant | null;
  /** Por defecto `true`. */
  addsToCardBalance?: boolean;
}

export type OneOffExpenseField = 'description' | 'amount' | 'date' | 'paymentMethodId';

export interface OneOffExpenseDraft {
  description: string;
  amountText: string;
  date: CivilDate | null;
  paymentMethodId: string | null;
  cardVariant?: CardVariant | null;
  addsToCardBalance?: boolean;
}

export function validateOneOffExpenseInput(
  draft: OneOffExpenseDraft,
  ctx: ExpenseValidationContext,
): Validation<OneOffExpenseInput, OneOffExpenseField> {
  const errors: Partial<Record<OneOffExpenseField, string>> = {};

  const description = draft.description.trim();
  if (description === '') errors.description = 'required';

  const amount = parseMoneyToCents(draft.amountText);
  if (!amount.ok) errors.amount = amount.error === 'empty' ? 'required' : amount.error;
  else if (amount.cents <= 0) errors.amount = 'not_positive';

  if (draft.date === null || draft.date === '') errors.date = 'required';
  else if (!isValidCivilDate(draft.date)) errors.date = 'invalid';

  if (!draft.paymentMethodId || !ctx.isActiveMethod(draft.paymentMethodId))
    errors.paymentMethodId = 'required';

  if (Object.keys(errors).length > 0 || !amount.ok) return { ok: false, errors };
  return {
    ok: true,
    value: {
      description,
      amountCents: amount.cents,
      date: draft.date!,
      paymentMethodId: draft.paymentMethodId!,
      cardVariant: normalizeCardVariant(draft.paymentMethodId!, draft.cardVariant, ctx),
      addsToCardBalance: draft.addsToCardBalance ?? true,
    },
  };
}
