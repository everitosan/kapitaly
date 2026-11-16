import { buildThisMonthView, oneOffCharges, type ThisMonthInput } from './balance';
import {
  compareCivilDates,
  daysInMonth,
  formatCivilDate,
  monthIndex,
  parseCivilDate,
  type CivilDate,
} from './date';
import { divideRoundHalfUp, sumCents, type Cents } from './money';

/** Un gasto que forma el total de un día: único o domiciliado (cobro recurrente). */
export interface DailyItem {
  key: string;
  kind: 'oneOff' | 'recurring';
  label: string;
  amountCents: Cents;
  /** Domiciliado que aún no llega a su fecha: se dibuja pero no suma. */
  upcoming: boolean;
}

export interface DailyDay {
  date: CivilDate;
  day: number;
  oneOffCents: Cents;
  /** Domiciliados cobrados (monto confirmado) o por confirmar (monto de la regla). */
  recurringCents: Cents;
  /** Domiciliados por cobrar: no suman en las cifras. */
  upcomingCents: Cents;
  /** Únicos por hora de registro y después los domiciliados. */
  items: DailyItem[];
}

export type DailyState = 'current' | 'past' | 'future';

export interface DailySpendingView {
  days: DailyDay[];
  totalCents: Cents;
  /** Promedio por día transcurrido, redondeado a pesos. */
  averageCents: Cents;
  /** Días terminados sin gastos únicos, desde el primer uso de la app. */
  daysWithoutRecords: number;
  /** Mayor `oneOffCents + recurringCents + upcomingCents` de un día (escala de la gráfica). */
  maxCents: Cents;
  state: DailyState;
}

export interface DailySpendingInput extends ThisMonthInput {
  /** Suma también los cobros recurrentes (switch "Incluir domiciliados"). */
  includeRecurring: boolean;
  /** Día del primer registro en la app; `null` si aún no hay registros. */
  firstUseDate: CivilDate | null;
}

/**
 * Gasto por día del mes: únicos y, con `includeRecurring`, domiciliados con el mismo estado y monto
 * que en "Tus gastos". "Días sin registros" solo considera únicos.
 */
export function buildDailySpending(input: DailySpendingInput): DailySpendingView {
  const { oneOffs, year, month, today, includeRecurring, firstUseDate } = input;
  const total = daysInMonth(year, month);
  const days: DailyDay[] = Array.from({ length: total }, (_, i) => ({
    date: formatCivilDate(year, month, i + 1),
    day: i + 1,
    oneOffCents: 0,
    recurringCents: 0,
    upcomingCents: 0,
    items: [],
  }));

  const ones = [...oneOffCharges(oneOffs, year, month)].sort((a, b) =>
    a.registeredAt.localeCompare(b.registeredAt),
  );
  for (const c of ones) {
    const d = days[parseCivilDate(c.date).day - 1];
    d.oneOffCents += c.amountCents;
    d.items.push({
      key: `oneOff:${c.id}`,
      kind: 'oneOff',
      label: c.label,
      amountCents: c.amountCents,
      upcoming: false,
    });
  }

  if (includeRecurring) {
    const charges = buildThisMonthView({ ...input, oneOffs: [] }).charges;
    for (const c of charges) {
      if (c.kind !== 'recurring' || c.status === 'skipped') continue;
      const d = days[parseCivilDate(c.date).day - 1];
      const upcoming = c.status === 'future';
      if (upcoming) d.upcomingCents += c.amountCents;
      else d.recurringCents += c.amountCents;
      d.items.push({
        key: `recurring:${c.id}`,
        kind: 'recurring',
        label: c.label,
        amountCents: c.amountCents,
        upcoming,
      });
    }
  }

  const t = parseCivilDate(today);
  const diff = monthIndex(year, month) - monthIndex(t.year, t.month);
  const state: DailyState = diff === 0 ? 'current' : diff < 0 ? 'past' : 'future';

  // Primer día que cuenta: el inicio del mes o el primer uso de la app, lo que sea después.
  let start = 1;
  if (firstUseDate !== null && compareCivilDates(firstUseDate, days[0].date) > 0) {
    start =
      compareCivilDates(firstUseDate, days[total - 1].date) > 0
        ? total + 1
        : parseCivilDate(firstUseDate).day;
  }
  const lastElapsed = state === 'past' ? total : state === 'current' ? t.day : 0;
  const lastFinished = state === 'past' ? total : state === 'current' ? t.day - 1 : 0;

  const totalCents = sumCents(days.map((d) => d.oneOffCents + d.recurringCents));
  const elapsed = Math.max(0, lastElapsed - start + 1);
  let daysWithoutRecords = 0;
  for (let day = start; day <= lastFinished; day++)
    if (!days[day - 1].items.some((i) => i.kind === 'oneOff')) daysWithoutRecords++;

  return {
    days,
    totalCents,
    averageCents: elapsed > 0 ? divideRoundHalfUp(totalCents, elapsed * 100) * 100 : 0,
    daysWithoutRecords,
    maxCents: Math.max(0, ...days.map((d) => d.oneOffCents + d.recurringCents + d.upcomingCents)),
    state,
  };
}
