import { isDeleted } from './common';
import {
  compareCivilDates,
  firstDayOfMonth,
  isInMonth,
  lastDayOfMonth,
  type CivilDate,
} from './date';
import { divideRoundHalfUp, sumCents, type Cents } from './money';
import type { OneOffExpense } from './oneOffExpense';
import type { PaymentMethod } from './paymentMethod';
import { monthsPerInterval, type RecurringExpense } from './recurringExpense';
import { nextOccurrenceOnOrAfter, occurrenceInMonth } from './schedule';

/** Un cargo del mes: un cobro de un gasto recurrente o un gasto único. */
export type MonthCharge =
  | {
      kind: 'recurring';
      id: string;
      date: CivilDate;
      label: string;
      amountCents: Cents;
      paymentMethodId: string;
      expense: RecurringExpense;
    }
  | {
      kind: 'oneOff';
      id: string;
      date: CivilDate;
      label: string;
      amountCents: Cents;
      paymentMethodId: string;
      expense: OneOffExpense;
    };

export interface MethodBreakdownEntry {
  paymentMethodId: string;
  /** `null` si el método no se encuentra (se muestra como "Método desconocido"). */
  method: PaymentMethod | null;
  amountCents: Cents;
}

export interface ThisMonthView {
  charges: MonthCharge[];
  count: number;
  totalCents: Cents;
  recurringCents: Cents;
  oneOffCents: Cents;
  /** De mayor a menor; solo métodos con monto > 0, incluidos los archivados. Suma = total. */
  breakdown: MethodBreakdownEntry[];
}

const byDateThenLabel = (a: MonthCharge, b: MonthCharge) =>
  compareCivilDates(a.date, b.date) || a.label.localeCompare(b.label, 'es');

/** Gastos únicos vigentes con fecha en el mes, como cargos. */
function oneOffCharges(
  oneOffs: readonly OneOffExpense[],
  year: number,
  month: number,
): MonthCharge[] {
  return oneOffs
    .filter((o) => !isDeleted(o) && isInMonth(o.date, year, month))
    .map((o) => ({
      kind: 'oneOff' as const,
      id: o.id,
      date: o.date,
      label: o.description,
      amountCents: o.amountCents,
      paymentMethodId: o.paymentMethodId,
      expense: o,
    }));
}

export function buildThisMonthView(
  recurring: readonly RecurringExpense[],
  oneOffs: readonly OneOffExpense[],
  methods: readonly PaymentMethod[],
  year: number,
  month: number,
): ThisMonthView {
  const recurringCharges: MonthCharge[] = [];
  for (const expense of recurring) {
    if (isDeleted(expense)) continue;
    const date = occurrenceInMonth(expense, year, month);
    if (date === null) continue;
    recurringCharges.push({
      kind: 'recurring',
      id: expense.id,
      date,
      label: expense.name,
      amountCents: expense.amountCents,
      paymentMethodId: expense.paymentMethodId,
      expense,
    });
  }
  const single = oneOffCharges(oneOffs, year, month);
  const charges = [...recurringCharges, ...single].sort(byDateThenLabel);

  const byMethod = new Map<string, Cents>();
  for (const c of charges)
    byMethod.set(c.paymentMethodId, (byMethod.get(c.paymentMethodId) ?? 0) + c.amountCents);
  const methodById = new Map(methods.map((m) => [m.id, m]));
  const breakdown = [...byMethod.entries()]
    .filter(([, amount]) => amount > 0)
    .map(([paymentMethodId, amountCents]) => ({
      paymentMethodId,
      method: methodById.get(paymentMethodId) ?? null,
      amountCents,
    }))
    .sort(
      (a, b) =>
        b.amountCents - a.amountCents ||
        (a.method?.name ?? '').localeCompare(b.method?.name ?? '', 'es'),
    );

  const recurringCents = sumCents(recurringCharges.map((c) => c.amountCents));
  const oneOffCents = sumCents(single.map((c) => c.amountCents));
  return {
    charges,
    count: charges.length,
    totalCents: recurringCents + oneOffCents,
    recurringCents,
    oneOffCents,
    breakdown,
  };
}

export interface AverageItem {
  expense: RecurringExpense;
  monthsPerInterval: number;
  /** Proporcional mensual redondeado al centavo. */
  monthlyCents: Cents;
  /**
   * Solo para intervalos de más de un mes: fecha del próximo cobro desde la fecha de referencia,
   * o `null` si ya no quedan cobros. `undefined` en gastos mensuales (sin pista).
   */
  nextCharge?: CivilDate | null;
}

export interface AverageView {
  items: AverageItem[];
  oneOffs: MonthCharge[];
  fixedCents: Cents;
  proratedCents: Cents;
  oneOffCents: Cents;
  totalCents: Cents;
  /** Fecha desde la que se calculan las pistas: la posterior entre hoy y el primer día del mes. */
  referenceDate: CivilDate;
}

/** Un gasto es vigente en un mes si su ancla ≤ último día del mes y su fin (si existe) ≥ primer día. */
export function isActiveInMonth(expense: RecurringExpense, year: number, month: number): boolean {
  return (
    !isDeleted(expense) &&
    compareCivilDates(expense.anchorDate, lastDayOfMonth(year, month)) <= 0 &&
    (expense.endDate === null ||
      compareCivilDates(expense.endDate, firstDayOfMonth(year, month)) >= 0)
  );
}

export function buildAverageView(
  recurring: readonly RecurringExpense[],
  oneOffs: readonly OneOffExpense[],
  year: number,
  month: number,
  today: CivilDate,
): AverageView {
  const first = firstDayOfMonth(year, month);
  const referenceDate = compareCivilDates(today, first) > 0 ? today : first;

  const items: AverageItem[] = recurring
    .filter((e) => isActiveInMonth(e, year, month))
    .map((expense) => {
      const months = monthsPerInterval(expense.intervalUnit, expense.intervalCount);
      const item: AverageItem = {
        expense,
        monthsPerInterval: months,
        monthlyCents: divideRoundHalfUp(expense.amountCents, months),
      };
      if (months > 1) item.nextCharge = nextOccurrenceOnOrAfter(expense, referenceDate);
      return item;
    })
    .sort(
      (a, b) =>
        b.monthlyCents - a.monthlyCents || a.expense.name.localeCompare(b.expense.name, 'es'),
    );

  const single = oneOffCharges(oneOffs, year, month).sort(byDateThenLabel);
  const fixedCents = sumCents(
    items.filter((i) => i.monthsPerInterval === 1).map((i) => i.monthlyCents),
  );
  const proratedCents = sumCents(
    items.filter((i) => i.monthsPerInterval > 1).map((i) => i.monthlyCents),
  );
  const oneOffCents = sumCents(single.map((c) => c.amountCents));
  return {
    items,
    oneOffs: single,
    fixedCents,
    proratedCents,
    oneOffCents,
    totalCents: fixedCents + proratedCents + oneOffCents,
    referenceDate,
  };
}
