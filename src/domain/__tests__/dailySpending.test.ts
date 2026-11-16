import { OTHER_CATEGORY_ID } from '../category';
import { buildDailySpending } from '../dailySpending';
import { formatMXNWhole } from '../money';
import type { OneOffExpense } from '../oneOffExpense';
import type { RecurringExpense } from '../recurringExpense';

const meta = {
  createdAt: '2026-10-01T12:00:00Z',
  updatedAt: '2026-10-01T12:00:00Z',
  deletedAt: null,
};

const rec = (name: string, amountCents: number, anchorDate: string): RecurringExpense => ({
  ...meta,
  id: name,
  name,
  amountCents,
  intervalUnit: 'month',
  intervalCount: 1,
  anchorDate,
  endDate: null,
  paymentMethodId: 'bbva',
  cardVariant: null,
  categoryId: OTHER_CATEGORY_ID,
});

let seq = 0;
const one = (description: string, amountCents: number, date: string): OneOffExpense => ({
  ...meta,
  createdAt: `${date}T12:00:${String(++seq % 60).padStart(2, '0')}Z`,
  id: `${description}-${seq}`,
  description,
  amountCents,
  date,
  paymentMethodId: 'cash',
  cardVariant: null,
  categoryId: OTHER_CATEGORY_ID,
  addsToCardBalance: true,
});

type Confirmation = Parameters<typeof buildDailySpending>[0]['confirmations'][number];
const charged = (id: string, occurrenceDate: string, amountCents: number): Confirmation => ({
  recurringExpenseId: id,
  occurrenceDate,
  status: 'charged',
  amountCents,
  deletedAt: null,
});
const skipped = (id: string, occurrenceDate: string): Confirmation => ({
  recurringExpenseId: id,
  occurrenceDate,
  status: 'skipped',
  amountCents: null,
  deletedAt: null,
});

const registeredOn = (iso: string) => iso.slice(0, 10);

// Noviembre 2026 de la spec: únicos los días 3, 7 (dos), 8, 10 y 15, que suman $995.00.
const NOV_ONE_OFFS = [
  one('Café', 4500, '2026-11-03'),
  one('Súper', 35000, '2026-11-07'),
  one('Uber', 7000, '2026-11-07'),
  one('Recarga metro', 10000, '2026-11-08'),
  one('Tacos', 25000, '2026-11-10'),
  one('Cine', 18000, '2026-11-15'),
];
// Domiciliados: Netflix confirmado con $239, Renta por confirmar, Gym no cobrado, Internet por cobrar.
const netflix = rec('Netflix', 21900, '2026-01-15');
const renta = rec('Renta', 150000, '2026-01-20');
const gym = rec('Gym', 50000, '2026-01-18');
const internet = rec('Internet', 45000, '2026-01-28');
const NOV_CONFIRMATIONS = [charged('Netflix', '2026-11-15', 23900), skipped('Gym', '2026-11-18')];

const daily = (
  opts: Partial<Parameters<typeof buildDailySpending>[0]> = {},
): ReturnType<typeof buildDailySpending> =>
  buildDailySpending({
    recurring: [netflix, renta, gym, internet],
    oneOffs: NOV_ONE_OFFS,
    confirmations: NOV_CONFIRMATIONS,
    year: 2026,
    month: 11,
    today: '2026-11-21',
    registeredOn,
    includeRecurring: false,
    firstUseDate: '2026-10-01',
    ...opts,
  });

const day = (v: ReturnType<typeof daily>, d: number) => v.days[d - 1];

describe('gasto por día con solo únicos', () => {
  it('un día por cada día del mes; los recurrentes no cuentan', () => {
    const v = daily();
    expect(v.days).toHaveLength(30);
    expect(day(v, 20).oneOffCents + day(v, 20).recurringCents).toBe(0);
    expect(day(v, 20).items).toEqual([]);
    expect(day(v, 10).oneOffCents).toBe(25000);
  });

  it('suma los únicos del mismo día en orden de registro', () => {
    const v = daily();
    expect(day(v, 7).oneOffCents).toBe(42000);
    expect(day(v, 7).items.map((i) => i.label)).toEqual(['Súper', 'Uber']);
  });

  it('total y promedio del mes actual', () => {
    const v = daily();
    expect(v.totalCents).toBe(99500);
    expect(v.averageCents).toBe(4700);
    expect(v.state).toBe('current');
  });

  it('un mes pasado promedia el mes completo', () => {
    const v = daily({
      oneOffs: [one('Súper', 310000, '2026-10-05')],
      month: 10,
      firstUseDate: '2026-09-01',
    });
    expect(v.state).toBe('past');
    expect(v.averageCents).toBe(10000);
  });

  it('promedia desde el primer uso si fue a mitad de mes', () => {
    const v = daily({
      oneOffs: [one('Súper', 50000, '2026-11-12')],
      today: '2026-11-20',
      firstUseDate: '2026-11-11',
    });
    expect(v.averageCents).toBe(5000);
  });

  it('ignora los únicos borrados', () => {
    const borrado = { ...one('Pizza', 30000, '2026-11-04'), deletedAt: '2026-11-05T00:00:00Z' };
    const v = daily({ oneOffs: [...NOV_ONE_OFFS, borrado] });
    expect(day(v, 4).items).toEqual([]);
    expect(v.totalCents).toBe(99500);
  });

  it('un mes futuro no tiene días transcurridos', () => {
    const v = daily({ month: 12, oneOffs: [] });
    expect(v.state).toBe('future');
    expect(v.averageCents).toBe(0);
    expect(v.daysWithoutRecords).toBe(0);
  });
});

describe('gasto por día con domiciliados', () => {
  it('apila el monto confirmado sobre los únicos del día', () => {
    const v = daily({ includeRecurring: true });
    expect(day(v, 15)).toMatchObject({ oneOffCents: 18000, recurringCents: 23900 });
    expect(day(v, 15).items.map((i) => [i.label, i.kind])).toEqual([
      ['Cine', 'oneOff'],
      ['Netflix', 'recurring'],
    ]);
  });

  it('el por confirmar suma con el monto de la regla y el no cobrado no cuenta', () => {
    const v = daily({ includeRecurring: true });
    expect(day(v, 20).recurringCents).toBe(150000);
    expect(day(v, 18).items).toEqual([]);
  });

  it('el por cobrar se dibuja pero no suma', () => {
    const v = daily({ includeRecurring: true });
    expect(day(v, 28)).toMatchObject({ recurringCents: 0, upcomingCents: 45000 });
    expect(day(v, 28).items[0]).toMatchObject({ label: 'Internet', upcoming: true });
    expect(v.totalCents).toBe(99500 + 23900 + 150000);
    expect(v.averageCents).toBe(13000);
  });

  it('la escala incluye lo por cobrar', () => {
    const v = daily({
      includeRecurring: true,
      recurring: [rec('Viaje', 900000, '2026-01-28')],
      confirmations: [],
    });
    expect(v.maxCents).toBe(900000);
  });
});

describe('días sin registros', () => {
  it('cuenta los días terminados sin únicos, con o sin domiciliados', () => {
    expect(daily().daysWithoutRecords).toBe(15);
    expect(daily({ includeRecurring: true }).daysWithoutRecords).toBe(15);
  });

  it('hoy no cuenta todavía', () => {
    const conHoy = daily({ oneOffs: [...NOV_ONE_OFFS, one('Pan', 3000, '2026-11-21')] });
    expect(conHoy.daysWithoutRecords).toBe(15);
  });

  it('solo desde el primer uso de la app', () => {
    const v = daily({
      oneOffs: [one('Café', 4000, '2026-11-11'), one('Tacos', 9000, '2026-11-13')],
      today: '2026-11-14',
      firstUseDate: '2026-11-11',
    });
    expect(v.daysWithoutRecords).toBe(1);
  });

  it('cero cuando se registró todos los días', () => {
    const v = daily({
      oneOffs: [one('A', 100, '2026-11-01'), one('B', 100, '2026-11-02')],
      today: '2026-11-03',
    });
    expect(v.daysWithoutRecords).toBe(0);
  });
});

describe('formatMXNWhole', () => {
  it('redondea a pesos sin centavos', () => {
    expect(formatMXNWhole(99500)).toBe('$995');
    expect(formatMXNWhole(273400)).toBe('$2,734');
    expect(formatMXNWhole(4750)).toBe('$48');
  });
});
