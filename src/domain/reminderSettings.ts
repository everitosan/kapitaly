import type { Validation } from './common';

/** Hora local "HH:MM" de 24 horas. */
export type ClockTime = string;

/** Preferencias de las notificaciones. Una sola por dispositivo. */
export interface ReminderSettings {
  /** Avisar el día de cada cobro recurrente y vencimiento de tarjeta. */
  chargesOn: boolean;
  chargesTime: ClockTime;
  /** Recordatorio diario para registrar los gastos del día. */
  dailyOn: boolean;
  dailyTime: ClockTime;
  /** Aviso por desuso: tras `idleDays` días sin registrar gastos. */
  idleOn: boolean;
  idleDays: number;
  /** Hora propia del desuso; `null` usa la del recordatorio diario. */
  idleTime: ClockTime | null;
}

export const IDLE_DAYS_MIN = 1;
export const IDLE_DAYS_MAX = 14;

/** Todo apagado: una instalación nueva no agenda nada. */
export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  chargesOn: false,
  chargesTime: '10:00',
  dailyOn: false,
  dailyTime: '21:00',
  idleOn: false,
  idleDays: 3,
  idleTime: null,
};

const CLOCK = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const isClockTime = (value: string): value is ClockTime => CLOCK.test(value);

/** Hora y minuto de una hora "HH:MM". */
export function parseClockTime(time: ClockTime): { hour: number; minute: number } {
  const m = CLOCK.exec(time);
  if (!m) throw new Error(`Hora inválida: ${time}`);
  return { hour: Number(m[1]), minute: Number(m[2]) };
}

export const formatClockTime = (hour: number, minute: number): ClockTime =>
  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

/** Hora a la que avisa el desuso: la propia o, si no tiene, la del recordatorio diario. */
export const effectiveIdleTime = (s: ReminderSettings): ClockTime => s.idleTime ?? s.dailyTime;

/** Cuántos avisos están encendidos (para el resumen en Ajustes). */
export const activeReminderCount = (s: ReminderSettings): number =>
  [s.chargesOn, s.dailyOn, s.idleOn].filter(Boolean).length;

export type ReminderSettingsField = 'chargesTime' | 'dailyTime' | 'idleTime' | 'idleDays';

/** Valida unas preferencias completas (horas "HH:MM", días de desuso de 1 a 14). */
export function validateReminderSettings(
  s: ReminderSettings,
): Validation<ReminderSettings, ReminderSettingsField> {
  const errors: Partial<Record<ReminderSettingsField, string>> = {};
  if (!isClockTime(s.chargesTime)) errors.chargesTime = 'invalid';
  if (!isClockTime(s.dailyTime)) errors.dailyTime = 'invalid';
  if (s.idleTime !== null && !isClockTime(s.idleTime)) errors.idleTime = 'invalid';
  if (!Number.isInteger(s.idleDays) || s.idleDays < IDLE_DAYS_MIN || s.idleDays > IDLE_DAYS_MAX)
    errors.idleDays = 'outOfRange';
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, value: s };
}
