import { isDeleted, type SyncMeta, type Validation } from './common';
import {
  clampedDate,
  compareCivilDates,
  isValidCivilDate,
  parseCivilDate,
  shiftMonth,
  type CivilDate,
} from './date';
import { parseMoneyToCents, sumCents, type Cents } from './money';
import type { OneOffExpense } from './oneOffExpense';
import type { PaymentMethod } from './paymentMethod';

/** Pago a una tarjeta de crédito: resta del usado; no es un gasto. */
export interface CardPayment extends SyncMeta {
  paymentMethodId: string;
  amountCents: Cents;
  date: CivilDate;
  /** Fecha de pago que cubre; `null` si la tarjeta no tiene día de pago. */
  forDueDate: CivilDate | null;
}

export interface CardPaymentInput {
  paymentMethodId: string;
  amountCents: Cents;
  date: CivilDate;
  forDueDate: CivilDate | null;
}

/** Lo mínimo de una confirmación de cobro que necesita el cálculo del usado. */
export interface ChargedRef {
  status: 'charged' | 'skipped';
  amountCents: Cents | null;
  occurrenceDate: CivilDate;
  paymentMethodId: string;
  deletedAt: string | null;
  /** Falso = ya venía en el saldo inicial; ausente cuenta como verdadero. */
  addsToCardBalance?: boolean;
}

type Card = Pick<
  PaymentMethod,
  'id' | 'kind' | 'openingBalanceCents' | 'openingBalanceDate' | 'paymentDueDay'
>;

const onOrAfter = (date: CivilDate, from: CivilDate | null) =>
  from === null || compareCivilDates(date, from) >= 0;

/**
 * Usado de una tarjeta = saldo inicial + gastos únicos con la tarjeta desde la fecha del saldo
 * + cobros recurrentes confirmados con la tarjeta desde esa fecha − pagos. Negativo = saldo a favor.
 * Los gastos y cobros marcados con `addsToCardBalance: false` ya venían en el saldo y no se suman.
 */
export function usedCents(
  card: Card,
  oneOffs: readonly (Pick<OneOffExpense, 'paymentMethodId' | 'amountCents' | 'date' | 'deletedAt'> &
    Partial<Pick<OneOffExpense, 'addsToCardBalance'>>)[],
  confirmations: readonly ChargedRef[],
  payments: readonly Pick<CardPayment, 'paymentMethodId' | 'amountCents' | 'deletedAt'>[],
): Cents {
  const from = card.openingBalanceDate;
  const spent = sumCents(
    oneOffs
      .filter(
        (o) =>
          !isDeleted(o) &&
          o.addsToCardBalance !== false &&
          o.paymentMethodId === card.id &&
          onOrAfter(o.date, from),
      )
      .map((o) => o.amountCents),
  );
  const charged = sumCents(
    confirmations
      .filter(
        (c) =>
          !isDeleted(c) &&
          c.status === 'charged' &&
          c.addsToCardBalance !== false &&
          c.paymentMethodId === card.id &&
          onOrAfter(c.occurrenceDate, from),
      )
      .map((c) => c.amountCents ?? 0),
  );
  const paid = sumCents(
    payments
      .filter((p) => !isDeleted(p) && p.paymentMethodId === card.id)
      .map((p) => p.amountCents),
  );
  return (card.openingBalanceCents ?? 0) + spent + charged - paid;
}

/** Fecha de pago del mes dado (día ajustado al último del mes si es más corto). */
export const dueDateIn = (year: number, month: number, day: number): CivilDate =>
  clampedDate(year, month, day);

/** Fecha de pago más reciente igual o anterior a `date`. */
export function lastDueOnOrBefore(day: number, date: CivilDate): CivilDate {
  const { year, month } = parseCivilDate(date);
  const thisMonth = dueDateIn(year, month, day);
  if (compareCivilDates(thisMonth, date) <= 0) return thisMonth;
  const prev = shiftMonth(year, month, -1);
  return dueDateIn(prev.year, prev.month, day);
}

/** Primera fecha de pago igual o posterior a `date`. */
export function nextDueOnOrAfter(day: number, date: CivilDate): CivilDate {
  const { year, month } = parseCivilDate(date);
  const thisMonth = dueDateIn(year, month, day);
  if (compareCivilDates(thisMonth, date) >= 0) return thisMonth;
  const next = shiftMonth(year, month, 1);
  return dueDateIn(next.year, next.month, day);
}

/** Número de día absoluto (días desde 1970-01-01), para medir distancias reales entre fechas. */
const dayNumber = (d: CivilDate) => {
  const p = parseCivilDate(d);
  return Date.UTC(p.year, p.month - 1, p.day) / 86_400_000;
};

/** Fecha de pago que cubre un pago hecho en `paymentDate`: la más cercana (en empate, la posterior). */
export function dueDateCoveredBy(
  card: Pick<Card, 'paymentDueDay'>,
  paymentDate: CivilDate,
): CivilDate | null {
  if (card.paymentDueDay === null) return null;
  const before = lastDueOnOrBefore(card.paymentDueDay, paymentDate);
  const after = nextDueOnOrAfter(card.paymentDueDay, paymentDate);
  if (before === after) return before;
  const target = dayNumber(paymentDate);
  return target - dayNumber(before) < dayNumber(after) - target ? before : after;
}

export interface PendingCardPayment {
  dueDate: CivilDate;
  /** Monto propuesto: el usado actual. */
  suggestedCents: Cents;
}

/**
 * Aviso de pago: la tarjeta tiene día de pago, usado > 0, y su fecha de pago más reciente ya llegó,
 * es igual o posterior a la del saldo inicial y ningún pago vigente la cubre.
 */
export function pendingCardPayment(
  card: Card,
  payments: readonly Pick<CardPayment, 'paymentMethodId' | 'forDueDate' | 'deletedAt'>[],
  today: CivilDate,
  used: Cents,
): PendingCardPayment | null {
  if (card.kind !== 'credit' || card.paymentDueDay === null || used <= 0) return null;
  const last = lastDueOnOrBefore(card.paymentDueDay, today);
  if (!onOrAfter(last, card.openingBalanceDate)) return null;
  const covered = payments.some(
    (p) => !isDeleted(p) && p.paymentMethodId === card.id && p.forDueDate === last,
  );
  return covered ? null : { dueDate: last, suggestedCents: used };
}

export type CardPaymentField = 'amount' | 'date';

/** Valida un pago capturado (monto > 0, fecha válida) y calcula la fecha de pago que cubre. */
export function validateCardPayment(
  draft: { amountText: string; date: CivilDate | null; forDueDate?: CivilDate | null },
  card: Pick<Card, 'id' | 'paymentDueDay'>,
): Validation<CardPaymentInput, CardPaymentField> {
  const errors: Partial<Record<CardPaymentField, string>> = {};
  const amount = parseMoneyToCents(draft.amountText);
  if (!amount.ok) errors.amount = amount.error === 'empty' ? 'required' : amount.error;
  else if (amount.cents <= 0) errors.amount = 'not_positive';
  if (!draft.date) errors.date = 'required';
  else if (!isValidCivilDate(draft.date)) errors.date = 'invalid';
  if (Object.keys(errors).length > 0 || !amount.ok || !draft.date) return { ok: false, errors };
  return {
    ok: true,
    value: {
      paymentMethodId: card.id,
      amountCents: amount.cents,
      date: draft.date,
      forDueDate:
        draft.forDueDate !== undefined ? draft.forDueDate : dueDateCoveredBy(card, draft.date),
    },
  };
}
