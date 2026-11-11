/**
 * Fechas civiles (de calendario) como cadenas `YYYY-MM-DD`.
 *
 * Una fecha de cobro no es un instante: no tiene hora ni zona horaria. Manejarlas como
 * cadenas evita los errores de zona horaria de `Date`. "Hoy" se calcula fuera del dominio
 * (con la zona local del dispositivo) y se pasa como parámetro, así el dominio es determinista.
 */

/** Fecha civil con formato `YYYY-MM-DD`. Las cadenas con ceros a la izquierda se ordenan bien al compararlas. */
export type CivilDate = string;

export interface CivilDateParts {
  year: number;
  /** 1 = enero … 12 = diciembre */
  month: number;
  day: number;
}

const PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function daysInMonth(year: number, month: number): number {
  // Día 0 del mes siguiente = último día del mes. Se usa UTC para no depender de la zona.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isValidCivilDate(value: string): boolean {
  const m = PATTERN.exec(value);
  if (!m) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}

export function parseCivilDate(value: CivilDate): CivilDateParts {
  if (!isValidCivilDate(value)) throw new Error(`Fecha civil inválida: "${value}"`);
  const [y, m, d] = value.split('-').map(Number);
  return { year: y, month: m, day: d };
}

export function formatCivilDate(year: number, month: number, day: number): CivilDate {
  const date = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  if (!isValidCivilDate(date)) throw new Error(`Fecha civil inválida: ${year}-${month}-${day}`);
  return date;
}

/** Fecha civil de `now` en la zona horaria local del entorno que llama. */
export function civilDateFromLocal(now: Date): CivilDate {
  return formatCivilDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** Negativo si `a` es anterior, 0 si son iguales, positivo si `a` es posterior. */
export function compareCivilDates(a: CivilDate, b: CivilDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Índice absoluto de mes (año × 12 + mes − 1), útil para medir distancias en meses. */
export function monthIndex(year: number, month: number): number {
  return year * 12 + (month - 1);
}

/** Año y mes que resultan de sumar `delta` meses (puede ser negativo). */
export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const index = monthIndex(year, month) + delta;
  return { year: Math.floor(index / 12), month: (((index % 12) + 12) % 12) + 1 };
}

/**
 * Fecha en el mes indicado con el día pedido, ajustado al último día si ese mes es más corto.
 * Ej.: día 31 en noviembre → 30 de noviembre; día 30 en febrero de 2027 → 28 de febrero.
 */
export function clampedDate(year: number, month: number, day: number): CivilDate {
  return formatCivilDate(year, month, Math.min(day, daysInMonth(year, month)));
}

/**
 * Suma `months` meses a `date` conservando su día y ajustándolo al último día del mes destino.
 * Siempre se calcula desde la fecha original (no encadenando ajustes), de modo que
 * 31 ene + 1 → 28 feb, pero 31 ene + 2 → 31 mar.
 */
export function addMonthsClamped(date: CivilDate, months: number): CivilDate {
  const { year, month, day } = parseCivilDate(date);
  const target = shiftMonth(year, month, months);
  return clampedDate(target.year, target.month, day);
}

export function firstDayOfMonth(year: number, month: number): CivilDate {
  return formatCivilDate(year, month, 1);
}

export function lastDayOfMonth(year: number, month: number): CivilDate {
  return formatCivilDate(year, month, daysInMonth(year, month));
}

/** Indica si la fecha cae en el año y mes dados. */
export function isInMonth(date: CivilDate, year: number, month: number): boolean {
  const p = parseCivilDate(date);
  return p.year === year && p.month === month;
}
