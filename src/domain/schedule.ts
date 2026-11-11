import {
  clampedDate,
  compareCivilDates,
  monthIndex,
  parseCivilDate,
  shiftMonth,
  type CivilDate,
} from './date';
import { monthsPerInterval, type RecurringExpense } from './recurringExpense';

type Schedulable = Pick<
  RecurringExpense,
  'anchorDate' | 'endDate' | 'intervalUnit' | 'intervalCount'
>;

/**
 * Fecha de cobro del gasto en el mes dado, o `null` si no cae en ese mes.
 * Hay cobro si la distancia en meses desde el mes del ancla es ≥ 0 y múltiplo del intervalo.
 * El día se toma siempre del ancla original y se ajusta al último día si el mes es más corto.
 * Con intervalos en meses, cada gasto tiene a lo sumo un cobro por mes.
 */
export function occurrenceInMonth(
  expense: Schedulable,
  year: number,
  month: number,
): CivilDate | null {
  const anchor = parseCivilDate(expense.anchorDate);
  const step = monthsPerInterval(expense.intervalUnit, expense.intervalCount);
  const distance = monthIndex(year, month) - monthIndex(anchor.year, anchor.month);
  if (distance < 0 || distance % step !== 0) return null;
  const date = clampedDate(year, month, anchor.day);
  if (compareCivilDates(date, expense.anchorDate) < 0) return null;
  if (expense.endDate !== null && compareCivilDates(date, expense.endDate) > 0) return null;
  return date;
}

/** Primer cobro que cae en `date` o después; `null` si ya no quedan (por la fecha de fin). */
export function nextOccurrenceOnOrAfter(expense: Schedulable, date: CivilDate): CivilDate | null {
  const anchor = parseCivilDate(expense.anchorDate);
  const step = monthsPerInterval(expense.intervalUnit, expense.intervalCount);
  const from = parseCivilDate(date);
  const anchorIdx = monthIndex(anchor.year, anchor.month);
  let distance = Math.max(0, monthIndex(from.year, from.month) - anchorIdx);
  distance = Math.ceil(distance / step) * step;

  // Como mucho hacen falta dos candidatos: el del mes de `date` (si su día ya pasó) y el siguiente.
  for (let i = 0; i < 2; i++) {
    const target = shiftMonth(anchor.year, anchor.month, distance + i * step);
    const candidate = clampedDate(target.year, target.month, anchor.day);
    if (expense.endDate !== null && compareCivilDates(candidate, expense.endDate) > 0) return null;
    if (compareCivilDates(candidate, date) >= 0) return candidate;
  }
  return null;
}
