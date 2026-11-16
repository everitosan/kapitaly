import { parseCivilDate, type CivilDate } from '@/domain/date';

export const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;
export const MONTH_SHORT = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const;

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** `15 nov 2026` */
export function formatShortDate(date: CivilDate): string {
  const { year, month, day } = parseCivilDate(date);
  return `${day} ${MONTH_SHORT[month - 1]} ${year}`;
}

/** Fecha del detalle por categoría: `8 nov`, `15 mar 2027` si es de otro año que `year`, `—` sin fecha. */
export function formatDetailDate(date: CivilDate | null, year: number): string {
  if (date === null) return '—';
  const d = parseCivilDate(date);
  const base = `${d.day} ${MONTH_SHORT[d.month - 1]}`;
  return d.year === year ? base : `${base} ${d.year}`;
}

/** Fecha para el lector de pantalla: `15 de marzo de 2027`. */
export function formatLongDate(date: CivilDate): string {
  const { year, month, day } = parseCivilDate(date);
  return `${day} de ${MONTH_NAMES[month - 1]} de ${year}`;
}

const WEEKDAYS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;

/** `Sábado 7 nov`. El día de la semana sale de la fecha civil, sin zona horaria. */
export function formatWeekdayDate(date: CivilDate): string {
  const { year, month, day } = parseCivilDate(date);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${weekday} ${day} ${MONTH_SHORT[month - 1]}`;
}

/** Fecha sin año para el lector de pantalla: `7 de noviembre`. */
export function formatDayMonth(date: CivilDate): string {
  const { month, day } = parseCivilDate(date);
  return `${day} de ${MONTH_NAMES[month - 1]}`;
}
