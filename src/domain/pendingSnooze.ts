/*
 * Posponer pendientes: "Posponer" en una tarjeta o "Cerrar" la hoja los calla durante 6 horas, aunque
 * se cierre la app. Puro: las fechas son ISO 8601 UTC.
 */

export const SNOOZE_HOURS = 6;
const SNOOZE_MS = SNOOZE_HOURS * 60 * 60 * 1000;

/** Clave de "Cerrar" la hoja: evita que se abra sola mientras esté vigente. */
export const SHEET_SNOOZE_KEY = 'sheet';

export interface PendingSnooze {
  /** `chargeKey`, `paymentKey` o `SHEET_SNOOZE_KEY`. */
  key: string;
  /** ISO UTC: cuando vence el plazo. */
  until: string;
}

/** Fin del plazo si se pospone ahora. */
export const snoozeUntil = (now: string): string =>
  new Date(new Date(now).getTime() + SNOOZE_MS).toISOString();

/** Si el plazo sigue vigente en `now` (vence justo a las 6 horas). */
export const isActiveSnooze = (snooze: Pick<PendingSnooze, 'until'>, now: string): boolean =>
  new Date(snooze.until).getTime() > new Date(now).getTime();

/** Milisegundos hasta el próximo vencimiento, o `null` si no hay plazos vigentes. */
export function msUntilNextExpiry(snoozes: readonly PendingSnooze[], now: string): number | null {
  const t = new Date(now).getTime();
  const next = snoozes
    .map((s) => new Date(s.until).getTime() - t)
    .filter((ms) => ms > 0)
    .sort((a, b) => a - b)[0];
  return next ?? null;
}
