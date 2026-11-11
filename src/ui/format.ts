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
