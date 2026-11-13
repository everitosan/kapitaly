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
  /** Si suma al usado de una tarjeta de crédito; falso = ya venía en el saldo inicial. */
  addsToCardBalance: boolean;
}

export interface ChargeConfirmationInput {
  recurringExpenseId: string;
  occurrenceDate: CivilDate;
  status: ConfirmationStatus;
  amountCents: Cents | null;
  paymentMethodId: string;
  /** Por defecto `true`. */
  addsToCardBalance?: boolean;
}

export interface PendingCharge {
  expense: RecurringExpense;
  date: CivilDate;
}

export const confirmationKey = (expenseId: string, date: CivilDate) => `${expenseId}|${date}`;
const key = confirmationKey;

/** Estado de un cobro recurrente concreto. */
export type ChargeStatus =
  /** Cobrado: confirmado (con su monto real) o anterior al registro del gasto (monto de la regla). */
  | { status: 'charged'; amountCents: Cents }
  /** Marcado como "No se cobró este mes". */
  | { status: 'skipped' }
  /** Ya pasó su fecha y falta la respuesta. */
  | { status: 'pending' }
  /** Aún no llega su fecha. */
  | { status: 'future' };

/** Primer día desde el que se pregunta por los cobros: máx(ancla, día local de registro). */
const askFrom = (
  expense: RecurringExpense,
  registeredOn: (iso: string) => CivilDate,
): CivilDate => {
  const registered = registeredOn(expense.createdAt);
  return compareCivilDates(expense.anchorDate, registered) > 0 ? expense.anchorDate : registered;
};

/**
 * Estado del cobro de `expense` en `date`. Manda la confirmación vigente si existe; si no, un cobro
 * anterior a máx(ancla, día local de registro) se da por cobrado con el monto de la regla (nunca se
 * pregunta por él); uno con fecha ≤ hoy está por confirmar y uno posterior, por cobrar.
 */
export function chargeStatus(
  expense: RecurringExpense,
  date: CivilDate,
  confirmation: Pick<ChargeConfirmation, 'status' | 'amountCents'> | undefined,
  today: CivilDate,
  registeredOn: (iso: string) => CivilDate,
): ChargeStatus {
  if (confirmation) {
    if (confirmation.status === 'skipped') return { status: 'skipped' };
    return { status: 'charged', amountCents: confirmation.amountCents ?? expense.amountCents };
  }
  if (compareCivilDates(date, askFrom(expense, registeredOn)) < 0)
    return { status: 'charged', amountCents: expense.amountCents };
  return compareCivilDates(date, today) <= 0 ? { status: 'pending' } : { status: 'future' };
}

/** Confirmaciones vigentes indexadas por gasto y fecha de cobro. */
export function indexConfirmations<
  C extends Pick<ChargeConfirmation, 'recurringExpenseId' | 'occurrenceDate' | 'deletedAt'>,
>(confirmations: readonly C[]): Map<string, C> {
  const map = new Map<string, C>();
  for (const c of confirmations)
    if (!isDeleted(c)) map.set(key(c.recurringExpenseId, c.occurrenceDate), c);
  return map;
}

/**
 * Cobros por confirmar: de cada gasto vigente, los cobros con fecha ≤ hoy y ≥ máx(ancla, día local
 * en que se registró el gasto) que no tienen confirmación (ver `chargeStatus`). `registeredOn`
 * convierte `createdAt` (UTC) a la fecha local; se inyecta para que el cálculo sea determinista.
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
  const answered = indexConfirmations(confirmations);
  const end = parseCivilDate(today);
  const pending: PendingCharge[] = [];
  for (const expense of recurring) {
    if (isDeleted(expense)) continue;
    const start = askFrom(expense, registeredOn);
    if (compareCivilDates(start, today) > 0) continue;
    const s = parseCivilDate(start);
    const months = monthIndex(end.year, end.month) - monthIndex(s.year, s.month);
    for (let i = 0; i <= months; i++) {
      const { year, month } = shiftMonth(s.year, s.month, i);
      const date = occurrenceInMonth(expense, year, month);
      if (date === null || answered.has(key(expense.id, date))) continue;
      if (chargeStatus(expense, date, undefined, today, registeredOn).status === 'pending')
        pending.push({ expense, date });
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
  draft: { status: ConfirmationStatus; amountText?: string; addsToCardBalance?: boolean },
  charge: PendingCharge,
): Validation<ChargeConfirmationInput, ConfirmationField> {
  const base = {
    recurringExpenseId: charge.expense.id,
    occurrenceDate: charge.date,
    paymentMethodId: charge.expense.paymentMethodId,
    addsToCardBalance: draft.addsToCardBalance ?? true,
  };
  if (draft.status === 'skipped')
    return { ok: true, value: { ...base, status: 'skipped', amountCents: null } };
  const amount = parseMoneyToCents(draft.amountText ?? '');
  if (!amount.ok)
    return { ok: false, errors: { amount: amount.error === 'empty' ? 'required' : amount.error } };
  if (amount.cents <= 0) return { ok: false, errors: { amount: 'not_positive' } };
  return { ok: true, value: { ...base, status: 'charged', amountCents: amount.cents } };
}
