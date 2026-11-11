import { buildAverageView, buildThisMonthView } from '../balance';
import type { OneOffExpense } from '../oneOffExpense';
import { NO_CARD_DATA, type PaymentMethod } from '../paymentMethod';
import type { IntervalUnit, RecurringExpense } from '../recurringExpense';

const meta = {
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  deletedAt: null,
};

const rec = (
  id: string,
  amountCents: number,
  anchorDate: string,
  paymentMethodId: string,
  intervalCount = 1,
  intervalUnit: IntervalUnit = 'month',
  extra: Partial<RecurringExpense> = {},
): RecurringExpense => ({
  ...meta,
  id,
  name: id,
  amountCents,
  intervalUnit,
  intervalCount,
  anchorDate,
  endDate: null,
  paymentMethodId,
  cardVariant: null,
  ...extra,
});

const one = (
  id: string,
  amountCents: number,
  date: string,
  paymentMethodId: string,
  extra: Partial<OneOffExpense> = {},
): OneOffExpense => ({
  ...meta,
  id,
  description: id,
  amountCents,
  date,
  paymentMethodId,
  cardVariant: null,
  ...extra,
});

const method = (id: string, name: string, extra: Partial<PaymentMethod> = {}): PaymentMethod => ({
  ...meta,
  id,
  name,
  kind: 'credit',
  institutionId: null,
  last4: null,
  color: 'cobalt',
  archivedAt: null,
  ...NO_CARD_DATA,
  ...extra,
});

const methods = [
  method('bbva', 'BBVA Azul'),
  method('nu', 'Nu Débito'),
  method('cash', 'Efectivo'),
];

// Datos de los escenarios del spec monthly-balance (noviembre 2026).
const netflix = rec('Netflix', 21900, '2026-01-15', 'bbva');
const renta = rec('Renta', 150000, '2026-01-20', 'nu');
const internet = rec('Internet', 45000, '2026-09-28', 'nu', 2);
const seguro = rec('Seguro', 600000, '2026-03-15', 'bbva', 1, 'year');
const metro = one('Recarga metro', 10000, '2026-11-08', 'cash');

describe('vista Este mes', () => {
  it('total, conteo, subtotales y orden por fecha', () => {
    const v = buildThisMonthView([netflix, renta, internet, seguro], [metro], methods, 2026, 11);
    expect(v.count).toBe(4);
    expect(v.totalCents).toBe(226900);
    expect(v.recurringCents).toBe(216900);
    expect(v.oneOffCents).toBe(10000);
    expect(v.charges.map((c) => c.label)).toEqual([
      'Recarga metro',
      'Netflix',
      'Renta',
      'Internet',
    ]);
    expect(v.charges[0].kind).toBe('oneOff');
    expect(v.charges.map((c) => c.date)).toEqual([
      '2026-11-08',
      '2026-11-15',
      '2026-11-20',
      '2026-11-28',
    ]);
  });

  it('mes sin cargos', () => {
    const v = buildThisMonthView([seguro], [], methods, 2026, 11);
    expect(v).toMatchObject({ count: 0, totalCents: 0, charges: [], breakdown: [] });
  });

  it('excluye gastos eliminados', () => {
    const v = buildThisMonthView(
      [{ ...netflix, deletedAt: '2026-11-02T00:00:00Z' }],
      [{ ...metro, deletedAt: '2026-11-09T00:00:00Z' }],
      methods,
      2026,
      11,
    );
    expect(v.count).toBe(0);
  });

  it('un gasto único cambiado de mes se cuenta en el nuevo mes', () => {
    const moved = { ...one('Comida', 45000, '2026-11-02', 'cash'), date: '2026-10-28' };
    expect(buildThisMonthView([], [moved], methods, 2026, 11).count).toBe(0);
    expect(buildThisMonthView([], [moved], methods, 2026, 10).totalCents).toBe(45000);
  });

  it('empates de fecha se ordenan por nombre', () => {
    const a = one('Zapatos', 100, '2026-11-05', 'cash');
    const b = one('Agua', 100, '2026-11-05', 'cash');
    expect(buildThisMonthView([], [a, b], methods, 2026, 11).charges.map((c) => c.label)).toEqual([
      'Agua',
      'Zapatos',
    ]);
  });
});

describe('desglose por método de pago', () => {
  it('suma por método, de mayor a menor, igual al total', () => {
    const v = buildThisMonthView([netflix, renta, internet], [metro], methods, 2026, 11);
    expect(v.breakdown.map((b) => [b.method?.name, b.amountCents])).toEqual([
      ['Nu Débito', 195000],
      ['BBVA Azul', 21900],
      ['Efectivo', 10000],
    ]);
    expect(v.breakdown.reduce((s, b) => s + b.amountCents, 0)).toBe(v.totalCents);
  });

  it('incluye métodos archivados con cargos', () => {
    const archived = method('old', 'Banamex Clásica', { archivedAt: '2026-10-01T00:00:00Z' });
    const v = buildThisMonthView(
      [rec('Servicio', 240000, '2026-05-10', 'old', 6)],
      [],
      [...methods, archived],
      2026,
      11,
    );
    expect(v.breakdown).toEqual([
      { paymentMethodId: 'old', method: archived, amountCents: 240000 },
    ]);
  });

  it('un método inexistente aparece con method = null', () => {
    const v = buildThisMonthView([], [one('X', 500, '2026-11-01', 'ghost')], methods, 2026, 11);
    expect(v.breakdown[0]).toEqual({ paymentMethodId: 'ghost', method: null, amountCents: 500 });
  });
});

describe('vista Promedio', () => {
  const today = '2026-11-11';

  it('proporcionales, únicos y subtotales', () => {
    const v = buildAverageView([netflix, renta, internet, seguro], [metro], 2026, 11, today);
    const monthly = Object.fromEntries(v.items.map((i) => [i.expense.name, i.monthlyCents]));
    expect(monthly).toEqual({ Netflix: 21900, Renta: 150000, Internet: 22500, Seguro: 50000 });
    expect(v.oneOffs.map((o) => [o.label, o.amountCents])).toEqual([['Recarga metro', 10000]]);
    expect(v).toMatchObject({
      totalCents: 254400,
      fixedCents: 171900,
      proratedCents: 72500,
      oneOffCents: 10000,
    });
  });

  it('redondeo al centavo y total con los valores mostrados', () => {
    const v = buildAverageView(
      [rec('Trimestral', 100000, '2026-02-01', 'bbva', 3)],
      [],
      2026,
      11,
      today,
    );
    expect(v.items[0].monthlyCents).toBe(33333);
    expect(v.totalCents).toBe(33333);
  });

  it('gasto aún no vigente', () => {
    expect(
      buildAverageView([rec('Futuro', 1000, '2026-12-10', 'bbva')], [], 2026, 11, today).items,
    ).toEqual([]);
  });

  it('gasto vigente con fecha de fin dentro del mes', () => {
    const r = rec('Termina', 1000, '2026-01-01', 'bbva', 1, 'month', { endDate: '2026-11-05' });
    expect(buildAverageView([r], [], 2026, 11, today).items).toHaveLength(1);
    expect(buildAverageView([r], [], 2026, 12, today).items).toHaveLength(0);
  });

  it('gastos únicos de otro mes no aparecen', () => {
    expect(
      buildAverageView([], [one('Cine', 18000, '2026-10-30', 'bbva')], 2026, 11, today).oneOffs,
    ).toEqual([]);
  });

  describe('pista del cobro real', () => {
    it('gasto anual visto en noviembre 2026', () => {
      const v = buildAverageView([seguro], [], 2026, 11, today);
      expect(v.items[0].nextCharge).toBe('2027-03-15');
    });

    it('referencia en un mes futuro', () => {
      const v = buildAverageView([internet], [], 2027, 1, today);
      expect(v.referenceDate).toBe('2027-01-01');
      expect(v.items[0].nextCharge).toBe('2027-01-28');
    });

    it('referencia en un mes pasado usa hoy', () => {
      expect(buildAverageView([internet], [], 2026, 10, today).referenceDate).toBe('2026-11-11');
    });

    it('los mensuales no llevan pista', () => {
      const v = buildAverageView([netflix], [], 2026, 11, today);
      expect(v.items[0]).not.toHaveProperty('nextCharge');
    });

    it('sin cobros próximos', () => {
      const r = rec('Semestral', 1000, '2026-01-01', 'bbva', 6, 'month', { endDate: '2026-06-30' });
      const v = buildAverageView([r], [], 2026, 6, today);
      expect(v.items[0].nextCharge).toBeNull();
    });
  });
});

it('el desglose suma física y digital en una sola línea por método', () => {
  const v = buildThisMonthView(
    [rec('Netflix', 21900, '2026-01-15', 'bbva', 1, 'month', { cardVariant: 'digital' })],
    [one('Farmacia', 23850, '2026-11-09', 'bbva', { cardVariant: 'physical' })],
    methods,
    2026,
    11,
  );
  expect(v.breakdown).toEqual([
    expect.objectContaining({ paymentMethodId: 'bbva', amountCents: 45750 }),
  ]);
});
