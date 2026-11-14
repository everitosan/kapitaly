import { isDeleted } from './common';
import {
  chargeStatus,
  confirmationKey,
  indexConfirmations,
  type ChargeConfirmation,
} from './confirmations';
import { nextDueOnOrAfter, usedCents, type CardPayment } from './creditCard';
import { compareCivilDates, formatCivilDate, parseCivilDate, type CivilDate } from './date';
import { formatMXN, type Cents } from './money';
import type { OneOffExpense } from './oneOffExpense';
import { isActiveMethod, methodLabel, type PaymentMethod } from './paymentMethod';
import type { RecurringExpense } from './recurringExpense';
import { effectiveIdleTime, type ClockTime, type ReminderSettings } from './reminderSettings';
import { nextOccurrenceOnOrAfter } from './schedule';

/*
 * Plan de notificaciones locales. Es puro: recibe las preferencias, los datos y "ahora" (fecha civil
 * y hora local) y devuelve qué agendar. El scheduler lo traduce a la API del sistema.
 */

/** Ventana de días hacia adelante en la que se agendan los avisos de cobros. */
export const CHARGES_WINDOW_DAYS = 60;
/** Máximo de días con aviso de cobros agendados a la vez. */
export const CHARGES_MAX = 40;
/** Avisos por desuso: a los n, 2n y 3n días. */
export const IDLE_REPEATS = 3;

export type ReminderTarget = 'pending' | 'new-expense';

export type ReminderTrigger =
  { kind: 'daily'; time: ClockTime } | { kind: 'date'; date: CivilDate; time: ClockTime };

export interface ScheduledReminder {
  /** Estable entre cálculos: `daily`, `charges|AAAA-MM-DD`, `idle|1`… */
  id: string;
  kind: 'charges' | 'daily' | 'idle';
  trigger: ReminderTrigger;
  title: string;
  body: string;
  target: ReminderTarget;
}

export interface ReminderData {
  recurring: readonly RecurringExpense[];
  oneOffs: readonly OneOffExpense[];
  confirmations: readonly ChargeConfirmation[];
  payments: readonly CardPayment[];
  methods: readonly PaymentMethod[];
}

export interface ReminderNow {
  /** Fecha civil local de hoy. */
  today: CivilDate;
  /** Hora local actual, "HH:MM". */
  time: ClockTime;
}

const dayNumber = (d: CivilDate) => {
  const p = parseCivilDate(d);
  return Date.UTC(p.year, p.month - 1, p.day) / 86_400_000;
};

/** Fecha civil `days` días después (o antes, si es negativo). */
export function addDays(date: CivilDate, days: number): CivilDate {
  const d = new Date((dayNumber(date) + days) * 86_400_000);
  return formatCivilDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** Si un aviso del día `date` a la hora `time` todavía no pasó. */
const isUpcoming = (date: CivilDate, time: ClockTime, now: ReminderNow) => {
  const c = compareCivilDates(date, now.today);
  return c > 0 || (c === 0 && time > now.time);
};

type ChargeItem =
  | { type: 'charge'; name: string; amountCents: Cents; method: string }
  | { type: 'due'; name: string; usedCents: Cents };

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
}

function chargesText(items: ChargeItem[]): { title: string; body: string } {
  if (items.length === 1) {
    const [item] = items;
    return item.type === 'charge'
      ? {
          title: `Hoy se cobra ${item.name}`,
          body: `${formatMXN(item.amountCents)} con ${item.method}. Confírmalo cuando pase.`,
        }
      : {
          title: `Hoy vence ${item.name}`,
          body: `Usado ${formatMXN(item.usedCents)}. Toca para registrar el pago.`,
        };
  }
  const names = items.map((i) => (i.type === 'charge' ? i.name : `pago de ${i.name}`));
  return {
    title: `Hoy tienes ${items.length} pendientes`,
    body: `${joinNames(names)}. Confírmalos cuando pasen.`,
  };
}

/** Cobros recurrentes y vencimientos de tarjeta que estarían pendientes cada día de la ventana. */
function chargesByDay(
  data: ReminderData,
  from: CivilDate,
  to: CivilDate,
  registeredOn: (iso: string) => CivilDate,
): Map<CivilDate, ChargeItem[]> {
  const byDay = new Map<CivilDate, ChargeItem[]>();
  const add = (date: CivilDate, item: ChargeItem) => {
    const list = byDay.get(date) ?? [];
    list.push(item);
    byDay.set(date, list);
  };
  const methodById = new Map(data.methods.map((m) => [m.id, m]));
  const answered = indexConfirmations(data.confirmations);

  for (const expense of data.recurring) {
    if (isDeleted(expense)) continue;
    let date = nextOccurrenceOnOrAfter(expense, from);
    while (date !== null && compareCivilDates(date, to) <= 0) {
      const confirmation = answered.get(confirmationKey(expense.id, date));
      // En su propio día, sin respuesta, el cobro estaría por confirmar.
      const status = chargeStatus(expense, date, confirmation, date, registeredOn).status;
      if (status === 'pending') {
        const method = methodById.get(expense.paymentMethodId);
        add(date, {
          type: 'charge',
          name: expense.name,
          amountCents: expense.amountCents,
          method: method ? methodLabel(method, expense.cardVariant) : 'método desconocido',
        });
      }
      date = nextOccurrenceOnOrAfter(expense, addDays(date, 1));
    }
  }

  for (const card of data.methods) {
    if (card.kind !== 'credit' || card.paymentDueDay === null || !isActiveMethod(card)) continue;
    const used = usedCents(card, data.oneOffs, data.confirmations, data.payments);
    if (used <= 0) continue;
    let due = nextDueOnOrAfter(card.paymentDueDay, from);
    while (compareCivilDates(due, to) <= 0) {
      const afterOpening =
        card.openingBalanceDate === null || compareCivilDates(due, card.openingBalanceDate) >= 0;
      const covered = data.payments.some(
        (p) => !isDeleted(p) && p.paymentMethodId === card.id && p.forDueDate === due,
      );
      if (afterOpening && !covered) add(due, { type: 'due', name: card.name, usedCents: used });
      due = nextDueOnOrAfter(card.paymentDueDay, addDays(due, 1));
    }
  }
  return byDay;
}

/** Día local del gasto registrado más reciente (único o recurrente), o `null` si no hay. */
function lastRegisteredOn(
  data: ReminderData,
  registeredOn: (iso: string) => CivilDate,
): CivilDate | null {
  let latest: string | null = null;
  for (const e of [...data.oneOffs, ...data.recurring]) {
    if (isDeleted(e)) continue;
    if (latest === null || e.createdAt > latest) latest = e.createdAt;
  }
  return latest === null ? null : registeredOn(latest);
}

/**
 * Qué notificaciones deben estar agendadas ahora. `registeredOn` convierte un `createdAt` (UTC) al día
 * local, igual que en el balance.
 */
export function planReminders(
  settings: ReminderSettings,
  data: ReminderData,
  now: ReminderNow,
  registeredOn: (iso: string) => CivilDate,
): ScheduledReminder[] {
  const plan: ScheduledReminder[] = [];

  if (settings.chargesOn) {
    const from = isUpcoming(now.today, settings.chargesTime, now)
      ? now.today
      : addDays(now.today, 1);
    const to = addDays(now.today, CHARGES_WINDOW_DAYS);
    const days = [...chargesByDay(data, from, to, registeredOn).entries()]
      .sort(([a], [b]) => compareCivilDates(a, b))
      .slice(0, CHARGES_MAX);
    for (const [date, items] of days) {
      plan.push({
        id: `charges|${date}`,
        kind: 'charges',
        trigger: { kind: 'date', date, time: settings.chargesTime },
        ...chargesText(items),
        target: 'pending',
      });
    }
  }

  if (settings.dailyOn) {
    plan.push({
      id: 'daily',
      kind: 'daily',
      trigger: { kind: 'daily', time: settings.dailyTime },
      title: '¿Ya anotaste tus gastos de hoy?',
      body: 'Toca para agregar uno.',
      target: 'new-expense',
    });
  }

  if (settings.idleOn) {
    // Sin gastos registrados, cuenta desde hoy (la última vez que la app recalculó el plan).
    const base = lastRegisteredOn(data, registeredOn) ?? now.today;
    const time = effectiveIdleTime(settings);
    for (let i = 1; i <= IDLE_REPEATS; i++) {
      const days = settings.idleDays * i;
      const date = addDays(base, days);
      if (!isUpcoming(date, time, now)) continue;
      plan.push({
        id: `idle|${i}`,
        kind: 'idle',
        trigger: { kind: 'date', date, time },
        title: `Llevas ${days} días sin registrar gastos`,
        body: 'Toca para ponerte al día.',
        target: 'new-expense',
      });
    }
  }

  return plan;
}
