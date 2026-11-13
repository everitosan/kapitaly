import { resolveCategory, type Category, type CategoryView } from './category';
import { isDeleted } from './common';
import {
  chargeStatus,
  confirmationKey,
  indexConfirmations,
  type ChargeConfirmation,
} from './confirmations';
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

/** Estado de un cargo del mes: los únicos siempre están cobrados. */
export type ChargeState = 'charged' | 'skipped' | 'pending' | 'future';

interface MonthChargeBase {
  id: string;
  date: CivilDate;
  label: string;
  /** Monto que se muestra y suma: el confirmado si lo hay; si no, el de la regla. */
  amountCents: Cents;
  /** Monto de la regla (en un único, el mismo `amountCents`). */
  expectedCents: Cents;
  status: ChargeState;
  /** `createdAt` del gasto: desempata cargos del mismo día. */
  registeredAt: string;
  paymentMethodId: string;
  categoryId: string;
}

/** Un cargo del mes: un cobro de un gasto recurrente o un gasto único. */
export type MonthCharge =
  | (MonthChargeBase & { kind: 'recurring'; expense: RecurringExpense })
  | (MonthChargeBase & { kind: 'oneOff'; expense: OneOffExpense });

export interface MethodBreakdownEntry {
  paymentMethodId: string;
  /** `null` si el método no se encuentra (se muestra como "Método desconocido"). */
  method: PaymentMethod | null;
  amountCents: Cents;
}

export interface ThisMonthView {
  /** Por fecha → hora de registro → nombre, de la más antigua a la más reciente. */
  charges: MonthCharge[];
  count: number;
  /** Únicos y recurrentes cobrados. */
  doneCents: Cents;
  /** Recurrentes por confirmar, con el monto de la regla. */
  pendingCents: Cents;
  /** Recurrentes que aún no llegan, con el monto de la regla. */
  futureCents: Cents;
  /** done + pending + future: los "no se cobró" no cuentan. */
  projectedCents: Cents;
}

export type SortDirection = 'asc' | 'desc';

const chronological = (a: MonthCharge, b: MonthCharge) =>
  compareCivilDates(a.date, b.date) ||
  (a.registeredAt < b.registeredAt ? -1 : a.registeredAt > b.registeredAt ? 1 : 0) ||
  a.label.localeCompare(b.label, 'es');

/** Ordena por fecha, hora de registro y nombre; `desc` invierte el orden completo. */
export function sortCharges(
  charges: readonly MonthCharge[],
  direction: SortDirection = 'asc',
): MonthCharge[] {
  const sign = direction === 'asc' ? 1 : -1;
  return [...charges].sort((a, b) => sign * chronological(a, b));
}

/** Gastos únicos vigentes con fecha en el mes, como cargos cobrados. */
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
      expectedCents: o.amountCents,
      status: 'charged' as const,
      registeredAt: o.createdAt,
      paymentMethodId: o.paymentMethodId,
      categoryId: o.categoryId,
      expense: o,
    }));
}

export interface ThisMonthInput {
  recurring: readonly RecurringExpense[];
  oneOffs: readonly OneOffExpense[];
  confirmations: readonly Pick<
    ChargeConfirmation,
    'recurringExpenseId' | 'occurrenceDate' | 'deletedAt' | 'status' | 'amountCents'
  >[];
  year: number;
  month: number;
  today: CivilDate;
  /** Día local de registro a partir de `createdAt` (UTC). */
  registeredOn: (iso: string) => CivilDate;
}

export function buildThisMonthView({
  recurring,
  oneOffs,
  confirmations,
  year,
  month,
  today,
  registeredOn,
}: ThisMonthInput): ThisMonthView {
  const answered = indexConfirmations(confirmations);
  const recurringCharges: MonthCharge[] = [];
  for (const expense of recurring) {
    if (isDeleted(expense)) continue;
    const date = occurrenceInMonth(expense, year, month);
    if (date === null) continue;
    const st = chargeStatus(
      expense,
      date,
      answered.get(confirmationKey(expense.id, date)),
      today,
      registeredOn,
    );
    recurringCharges.push({
      kind: 'recurring',
      id: expense.id,
      date,
      label: expense.name,
      amountCents: st.status === 'charged' ? st.amountCents : expense.amountCents,
      expectedCents: expense.amountCents,
      status: st.status,
      registeredAt: expense.createdAt,
      paymentMethodId: expense.paymentMethodId,
      categoryId: expense.categoryId,
      expense,
    });
  }
  const charges = sortCharges([...recurringCharges, ...oneOffCharges(oneOffs, year, month)]);
  const total = (status: ChargeState) =>
    sumCents(charges.filter((c) => c.status === status).map((c) => c.amountCents));
  const doneCents = total('charged');
  const pendingCents = total('pending');
  const futureCents = total('future');
  return {
    charges,
    count: charges.length,
    doneCents,
    pendingCents,
    futureCents,
    projectedCents: doneCents + pendingCents + futureCents,
  };
}

/** Suma por método de pago, de mayor a menor; solo montos > 0. */
function methodBreakdown(
  amounts: readonly { paymentMethodId: string; amountCents: Cents }[],
  methods: readonly PaymentMethod[],
): MethodBreakdownEntry[] {
  const byMethod = new Map<string, Cents>();
  for (const a of amounts)
    byMethod.set(a.paymentMethodId, (byMethod.get(a.paymentMethodId) ?? 0) + a.amountCents);
  const methodById = new Map(methods.map((m) => [m.id, m]));
  return [...byMethod.entries()]
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

export interface CategoryBreakdownEntry {
  category: CategoryView;
  amountCents: Cents;
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
  /** Costo mensual por categoría (borradas → "Otro"), de mayor a menor. Suma = total. */
  byCategory: CategoryBreakdownEntry[];
  /** Costo mensual por método (físico y digital juntos, archivados incluidos). Suma = total. */
  byMethod: MethodBreakdownEntry[];
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
  lookups: { methods: readonly PaymentMethod[]; categories: readonly Category[] },
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

  const single = oneOffCharges(oneOffs, year, month);
  const fixedCents = sumCents(
    items.filter((i) => i.monthsPerInterval === 1).map((i) => i.monthlyCents),
  );
  const proratedCents = sumCents(
    items.filter((i) => i.monthsPerInterval > 1).map((i) => i.monthlyCents),
  );
  const oneOffCents = sumCents(single.map((c) => c.amountCents));

  // Mismos montos que el total: proporcionales de los recurrentes y únicos del mes.
  const parts = [
    ...items.map((i) => ({
      categoryId: i.expense.categoryId,
      paymentMethodId: i.expense.paymentMethodId,
      cents: i.monthlyCents,
    })),
    ...single.map((c) => ({
      categoryId: c.categoryId,
      paymentMethodId: c.paymentMethodId,
      cents: c.amountCents,
    })),
  ];
  const categoryTotals = new Map<string, CategoryBreakdownEntry>();
  for (const p of parts) {
    const category = resolveCategory(p.categoryId, lookups.categories);
    const entry = categoryTotals.get(category.id) ?? { category, amountCents: 0 };
    entry.amountCents += p.cents;
    categoryTotals.set(category.id, entry);
  }
  const byCategory = [...categoryTotals.values()]
    .filter((e) => e.amountCents > 0)
    .sort(
      (a, b) =>
        b.amountCents - a.amountCents || a.category.name.localeCompare(b.category.name, 'es'),
    );

  return {
    items,
    oneOffs: single,
    fixedCents,
    proratedCents,
    oneOffCents,
    totalCents: fixedCents + proratedCents + oneOffCents,
    referenceDate,
    byCategory,
    byMethod: methodBreakdown(
      parts.map((p) => ({ paymentMethodId: p.paymentMethodId, amountCents: p.cents })),
      lookups.methods,
    ),
  };
}
