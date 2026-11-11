import { isDeleted, type SyncMeta, type Validation } from './common';
import { compareCivilDates, monthIndex, parseCivilDate, shiftMonth, type CivilDate } from './date';
import { parseMoneyToCents, type Cents } from './money';
import type { RecurringExpense } from './recurringExpense';
import { occurrenceInMonth } from './schedule';

export type ConfirmationStatus = 'charged' | 'skipped';

/** Respuesta del usuario a un cobro recurrente. "Aún no" no se guarda. */
export interface ChargeConfirmation extends SyncMeta {
  recurringExpenseId: string;
  occurrenceDate: CivilDate;
  status: ConfirmationStatus;
  /** Monto realmente cobrado; `null` si se descartó. */
  amountCents: Cents | null;
  /** Método del gasto al confirmar. */
  paymentMethodId: string;
}

export interface ChargeConfirmationInput {
  recurringExpenseId: string;
  occurrenceDate: CivilDate;
  status: ConfirmationStatus;
  amountCents: Cents | null;
  paymentMethodId: string;
}

export interface PendingCharge {
  expense: RecurringExpense;
  date: CivilDate;
}

const key = (expenseId: string, date: CivilDate) => `${expenseId}|${date}`;

/**
 * Cobros por confirmar: de cada gasto vigente, los cobros con fecha ≤ hoy y ≥ máx(ancla, día local
 * en que se registró el gasto) que no tienen confirmación. `registeredOn` convierte `createdAt` (UTC)
 * a la fecha local; se inyecta para que el cálculo sea determinista.
 */
export function pendingConfirmations(
  recurring: readonly RecurringExpense[],
  confirmations: readonly Pick<
    ChargeConfirmation,
    'recurringExpenseId' | 'occurrenceDate' | 'deletedAt'
  >[],
  today: CivilDate,
  registeredOn: (iso: string) => CivilDate,
): PendingCharge[] {
  const answered = new Set(
    confirmations
      .filter((c) => !isDeleted(c))
      .map((c) => key(c.recurringExpenseId, c.occurrenceDate)),
  );
  const end = parseCivilDate(today);
  const pending: PendingCharge[] = [];
  for (const expense of recurring) {
    if (isDeleted(expense)) continue;
    const registered = registeredOn(expense.createdAt);
    const start =
      compareCivilDates(expense.anchorDate, registered) > 0 ? expense.anchorDate : registered;
    if (compareCivilDates(start, today) > 0) continue;
    const s = parseCivilDate(start);
    const months = monthIndex(end.year, end.month) - monthIndex(s.year, s.month);
    for (let i = 0; i <= months; i++) {
      const { year, month } = shiftMonth(s.year, s.month, i);
      const date = occurrenceInMonth(expense, year, month);
      if (date === null || compareCivilDates(date, start) < 0 || compareCivilDates(date, today) > 0)
        continue;
      if (!answered.has(key(expense.id, date))) pending.push({ expense, date });
    }
  }
  return pending.sort(
    (a, b) =>
      compareCivilDates(a.date, b.date) || a.expense.name.localeCompare(b.expense.name, 'es'),
  );
}

/** Indica si un cobro concreto está por confirmar (para la marca "Por confirmar"). */
export const isPending = (
  pending: readonly PendingCharge[],
  expenseId: string,
  date: CivilDate,
): boolean => pending.some((p) => p.expense.id === expenseId && p.date === date);

export type ConfirmationField = 'amount';

/** "Sí, se cobró" requiere un monto > 0; "No se cobró este mes" se guarda sin monto. */
export function validateConfirmation(
  draft: { status: ConfirmationStatus; amountText?: string },
  charge: PendingCharge,
): Validation<ChargeConfirmationInput, ConfirmationField> {
  const base = {
    recurringExpenseId: charge.expense.id,
    occurrenceDate: charge.date,
    paymentMethodId: charge.expense.paymentMethodId,
  };
  if (draft.status === 'skipped')
    return { ok: true, value: { ...base, status: 'skipped', amountCents: null } };
  const amount = parseMoneyToCents(draft.amountText ?? '');
  if (!amount.ok)
    return { ok: false, errors: { amount: amount.error === 'empty' ? 'required' : amount.error } };
  if (amount.cents <= 0) return { ok: false, errors: { amount: 'not_positive' } };
  return { ok: true, value: { ...base, status: 'charged', amountCents: amount.cents } };
}
