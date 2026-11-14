import { OTHER_CATEGORY_ID } from '../category';
import type { ChargeConfirmation } from '../confirmations';
import type { CardPayment } from '../creditCard';
import type { OneOffExpense } from '../oneOffExpense';
import type { PaymentMethod } from '../paymentMethod';
import type { RecurringExpense } from '../recurringExpense';
import { DEFAULT_REMINDER_SETTINGS, type ReminderSettings } from '../reminderSettings';
import {
  addDays,
  CHARGES_MAX,
  planReminders,
  type ReminderData,
  type ScheduledReminder,
} from '../reminders';

const registeredOn = (iso: string) => iso.slice(0, 10);
const meta = (id: string, createdAt = '2026-11-01T12:00:00Z') => ({
  id,
  createdAt,
  updatedAt: createdAt,
  deletedAt: null,
});

const bbva: PaymentMethod = {
  ...meta('bbva', '2026-10-01T12:00:00Z'),
  name: 'BBVA Azul',
  kind: 'credit',
  institutionId: null,
  last4: null,
  color: null,
  openingBalanceCents: 745750,
  openingBalanceDate: '2026-11-01',
  creditLimitCents: null,
  paymentDueDay: 5,
  hasDigital: false,
  digitalLast4: null,
  archivedAt: null,
};

/** La misma tarjeta sin saldo: sin avisos de vencimiento, para probar solo los cobros. */
const bbvaPaid: PaymentMethod = { ...bbva, openingBalanceCents: 0 };

const rec = (over: Partial<RecurringExpense> = {}): RecurringExpense => ({
  ...meta('netflix'),
  name: 'Netflix',
  amountCents: 21900,
  intervalUnit: 'month',
  intervalCount: 1,
  anchorDate: '2026-01-15',
  endDate: null,
  paymentMethodId: 'bbva',
  cardVariant: null,
  categoryId: OTHER_CATEGORY_ID,
  ...over,
});

const oneOff = (createdAt: string): OneOffExpense => ({
  ...meta(`o-${createdAt}`, createdAt),
  description: 'Tacos',
  amountCents: 10000,
  date: createdAt.slice(0, 10),
  paymentMethodId: 'cash',
  cardVariant: null,
  addsToCardBalance: true,
  categoryId: OTHER_CATEGORY_ID,
});

const confirm = (occurrenceDate: string): ChargeConfirmation => ({
  ...meta(`c-${occurrenceDate}`),
  recurringExpenseId: 'netflix',
  occurrenceDate,
  status: 'charged',
  amountCents: 21900,
  paymentMethodId: 'bbva',
  addsToCardBalance: true,
});

const payment = (forDueDate: string): CardPayment => ({
  ...meta(`p-${forDueDate}`),
  paymentMethodId: 'bbva',
  amountCents: 100000,
  date: forDueDate,
  forDueDate,
});

const data = (over: Partial<ReminderData> = {}): ReminderData => ({
  recurring: [],
  oneOffs: [],
  confirmations: [],
  payments: [],
  methods: [],
  ...over,
});

const settings = (over: Partial<ReminderSettings>): ReminderSettings => ({
  ...DEFAULT_REMINDER_SETTINGS,
  ...over,
});

const at = (today: string, time = '08:00') => ({ today, time });
const ids = (plan: ScheduledReminder[]) => plan.map((r) => r.id);
const find = (plan: ScheduledReminder[], id: string) => plan.find((r) => r.id === id);

describe('addDays', () => {
  it('cruza meses y años', () => {
    expect(addDays('2026-11-29', 3)).toBe('2026-12-02');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('planReminders', () => {
  it('con todo apagado no agenda nada', () => {
    const plan = planReminders(
      DEFAULT_REMINDER_SETTINGS,
      data({ recurring: [rec()], methods: [bbvaPaid] }),
      at('2026-11-14'),
      registeredOn,
    );
    expect(plan).toEqual([]);
  });

  describe('aviso el día del cobro', () => {
    const s = settings({ chargesOn: true, chargesTime: '10:00' });

    it('un cobro: "Hoy se cobra Netflix" con monto y método, que abre Pendientes', () => {
      const plan = planReminders(
        s,
        data({ recurring: [rec()], methods: [bbvaPaid] }),
        at('2026-11-14'),
        registeredOn,
      );
      expect(find(plan, 'charges|2026-11-15')).toEqual({
        id: 'charges|2026-11-15',
        kind: 'charges',
        trigger: { kind: 'date', date: '2026-11-15', time: '10:00' },
        title: 'Hoy se cobra Netflix',
        body: '$219.00 con BBVA Azul. Confírmalo cuando pase.',
        target: 'pending',
      });
      // También los meses siguientes dentro de la ventana de 60 días (hasta el 13/01/2027).
      expect(ids(plan)).toEqual(['charges|2026-11-15', 'charges|2026-12-15']);
    });

    it('vencimiento de tarjeta: "Hoy vence BBVA Azul" con el usado', () => {
      const plan = planReminders(s, data({ methods: [bbva] }), at('2026-12-01'), registeredOn);
      expect(find(plan, 'charges|2026-12-05')).toMatchObject({
        title: 'Hoy vence BBVA Azul',
        body: 'Usado $7,457.50. Toca para registrar el pago.',
        target: 'pending',
      });
    });

    it('un vencimiento ya pagado no avisa', () => {
      const plan = planReminders(
        s,
        data({ methods: [bbva], payments: [payment('2026-12-05')] }),
        at('2026-12-01'),
        registeredOn,
      );
      expect(find(plan, 'charges|2026-12-05')).toBeUndefined();
    });

    it('sin usado no avisa el vencimiento', () => {
      const plan = planReminders(s, data({ methods: [bbvaPaid] }), at('2026-12-01'), registeredOn);
      expect(plan).toEqual([]);
    });

    it('varios el mismo día van en una sola notificación', () => {
      const seguro = rec({ id: 'seguro', name: 'Seguro del auto', anchorDate: '2026-11-20' });
      const gym = rec({ id: 'gym', name: 'Gimnasio', anchorDate: '2026-11-20' });
      const plan = planReminders(
        s,
        data({ recurring: [seguro, gym], methods: [bbvaPaid] }),
        at('2026-11-14'),
        registeredOn,
      );
      const day = find(plan, 'charges|2026-11-20');
      expect(day?.title).toBe('Hoy tienes 2 pendientes');
      expect(day?.body).toContain('Seguro del auto');
      expect(day?.body).toContain('Gimnasio');
    });

    it('confirmado antes de la hora: ya no avisa ese día', () => {
      const plan = planReminders(
        s,
        data({ recurring: [rec()], methods: [bbva], confirmations: [confirm('2026-11-15')] }),
        at('2026-11-15', '08:00'),
        registeredOn,
      );
      expect(find(plan, 'charges|2026-11-15')).toBeUndefined();
    });

    it('si la hora de hoy ya pasó, empieza mañana', () => {
      const plan = planReminders(
        s,
        data({ recurring: [rec()], methods: [bbvaPaid] }),
        at('2026-11-15', '11:00'),
        registeredOn,
      );
      expect(ids(plan)[0]).toBe('charges|2026-12-15');
    });

    it('no avisa cobros anteriores al registro del gasto', () => {
      const r = rec({ anchorDate: '2026-01-15', createdAt: '2026-11-20T12:00:00Z' });
      const plan = planReminders(
        s,
        data({ recurring: [r], methods: [bbvaPaid] }),
        at('2026-11-14'),
        registeredOn,
      );
      expect(ids(plan)[0]).toBe('charges|2026-12-15');
    });

    it(`agenda como máximo ${CHARGES_MAX} días`, () => {
      const many = Array.from({ length: 28 }, (_, i) =>
        rec({
          id: `r${i}`,
          name: `Gasto ${i}`,
          anchorDate: `2026-01-${String(i + 1).padStart(2, '0')}`,
        }),
      );
      const plan = planReminders(
        s,
        data({ recurring: many, methods: [bbvaPaid] }),
        at('2026-11-14'),
        registeredOn,
      );
      expect(plan).toHaveLength(CHARGES_MAX);
    });
  });

  describe('recordatorio diario', () => {
    it('agenda un aviso diario a la hora elegida que abre "Nuevo gasto"', () => {
      const plan = planReminders(
        settings({ dailyOn: true, dailyTime: '21:00' }),
        data(),
        at('2026-11-14'),
        registeredOn,
      );
      expect(plan).toEqual([
        {
          id: 'daily',
          kind: 'daily',
          trigger: { kind: 'daily', time: '21:00' },
          title: '¿Ya anotaste tus gastos de hoy?',
          body: 'Toca para agregar uno.',
          target: 'new-expense',
        },
      ]);
    });
  });

  describe('aviso por desuso', () => {
    const s = settings({ idleOn: true, idleDays: 3, dailyTime: '21:00' });

    it('sin registrar: avisa a los 3, 6 y 9 días y nada más', () => {
      const plan = planReminders(
        s,
        data({ oneOffs: [oneOff('2026-11-10T18:00:00Z')] }),
        at('2026-11-10', '19:00'),
        registeredOn,
      );
      expect(plan.map((r) => [r.trigger, r.title])).toEqual([
        [{ kind: 'date', date: '2026-11-13', time: '21:00' }, 'Llevas 3 días sin registrar gastos'],
        [{ kind: 'date', date: '2026-11-16', time: '21:00' }, 'Llevas 6 días sin registrar gastos'],
        [{ kind: 'date', date: '2026-11-19', time: '21:00' }, 'Llevas 9 días sin registrar gastos'],
      ]);
      expect(plan.every((r) => r.target === 'new-expense')).toBe(true);
    });

    it('registrar un gasto reinicia la cuenta', () => {
      const plan = planReminders(
        s,
        data({ oneOffs: [oneOff('2026-11-10T18:00:00Z'), oneOff('2026-11-12T18:00:00Z')] }),
        at('2026-11-12', '19:00'),
        registeredOn,
      );
      expect(plan[0].trigger).toEqual({ kind: 'date', date: '2026-11-15', time: '21:00' });
    });

    it('un recurrente nuevo también cuenta como registro', () => {
      const plan = planReminders(
        s,
        data({
          oneOffs: [oneOff('2026-11-01T18:00:00Z')],
          recurring: [rec({ createdAt: '2026-11-11T18:00:00Z' })],
        }),
        at('2026-11-12'),
        registeredOn,
      );
      expect(plan[0].trigger).toMatchObject({ date: '2026-11-14' });
    });

    it('omite los avisos que ya pasaron', () => {
      const plan = planReminders(
        s,
        data({ oneOffs: [oneOff('2026-11-01T18:00:00Z')] }),
        at('2026-11-05', '22:00'),
        registeredOn,
      );
      expect(plan.map((r) => r.id)).toEqual(['idle|2', 'idle|3']);
    });

    it('usa la hora del diario o la propia', () => {
      const shared = planReminders(
        settings({ idleOn: true, dailyTime: '20:30' }),
        data(),
        at('2026-11-14'),
        registeredOn,
      );
      expect(shared[0].trigger).toMatchObject({ time: '20:30' });
      const own = planReminders(
        settings({ idleOn: true, dailyTime: '20:30', idleTime: '08:00' }),
        data(),
        at('2026-11-14'),
        registeredOn,
      );
      expect(own[0].trigger).toMatchObject({ time: '08:00' });
    });

    it('sin gastos registrados cuenta desde hoy', () => {
      const plan = planReminders(s, data(), at('2026-11-14'), registeredOn);
      expect(plan[0].trigger).toMatchObject({ date: '2026-11-17' });
    });
  });
});
