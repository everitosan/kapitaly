import { BUILTIN_CATEGORIES, OTHER_CATEGORY_ID, type Category } from '../category';
import { buildAverageView, buildThisMonthView, sortCharges } from '../balance';
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
  categoryId: OTHER_CATEGORY_ID,
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
  categoryId: OTHER_CATEGORY_ID,
  addsToCardBalance: true,
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

const CATEGORIES: Category[] = BUILTIN_CATEGORIES.map((c) => ({
  ...meta,
  ...c,
  builtin: true,
  hiddenAt: null,
}));

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

const registeredOn = (iso: string) => iso.slice(0, 10);
const TODAY = '2026-11-11';

type Confirmation = Parameters<typeof buildThisMonthView>[0]['confirmations'][number];
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

// Los gastos de los escenarios se registran el 1 nov 2026: los cobros de noviembre se preguntan.
const nov = { createdAt: '2026-11-01T12:00:00Z' };
const thisMonth = (
  recurring: RecurringExpense[],
  oneOffs: OneOffExpense[],
  opts: { confirmations?: Confirmation[]; today?: string; year?: number; month?: number } = {},
) =>
  buildThisMonthView({
    recurring: recurring.map((r) => ({ ...r, ...nov })),
    oneOffs,
    confirmations: opts.confirmations ?? [],
    year: opts.year ?? 2026,
    month: opts.month ?? 11,
    today: opts.today ?? TODAY,
    registeredOn,
  });

describe('vista Este mes', () => {
  it('total y conteo del mes: conteo, orden y efectuado de proyectado', () => {
    const v = thisMonth([netflix, renta, internet, seguro], [metro]);
    expect(v.count).toBe(4);
    expect(v.charges.map((c) => c.label)).toEqual([
      'Recarga metro',
      'Netflix',
      'Renta',
      'Internet',
    ]);
    expect(v.charges[0].kind).toBe('oneOff');
    expect(v.doneCents).toBe(10000);
    expect(v.projectedCents).toBe(226900);
  });

  it('mes sin cargos', () => {
    expect(thisMonth([seguro], [])).toMatchObject({
      count: 0,
      charges: [],
      doneCents: 0,
      projectedCents: 0,
    });
  });

  it('excluye gastos eliminados', () => {
    const v = thisMonth(
      [{ ...netflix, deletedAt: '2026-11-02T00:00:00Z' }],
      [{ ...metro, deletedAt: '2026-11-09T00:00:00Z' }],
    );
    expect(v.count).toBe(0);
  });

  it('un gasto único cambiado de mes se cuenta en el nuevo mes', () => {
    const moved = { ...one('Comida', 45000, '2026-11-02', 'cash'), date: '2026-10-28' };
    expect(thisMonth([], [moved]).count).toBe(0);
    expect(thisMonth([], [moved], { month: 10 }).doneCents).toBe(45000);
  });
});

describe('efectuado y proyectado', () => {
  const today = '2026-11-21';

  it('suma únicos y confirmados con su monto real; proyecta lo pendiente y lo futuro', () => {
    const v = thisMonth([netflix, renta, internet], [metro], {
      today,
      confirmations: [charged('Netflix', '2026-11-15', 23900)],
    });
    expect(v.doneCents).toBe(33900);
    expect(v.projectedCents).toBe(228900);
    const netflixCharge = v.charges.find((c) => c.id === 'Netflix');
    expect(netflixCharge).toMatchObject({
      status: 'charged',
      amountCents: 23900,
      expectedCents: 21900,
    });
  });

  it('partes de la barra: por confirmar y por cobrar', () => {
    const v = thisMonth([netflix, renta, internet], [metro], {
      today,
      confirmations: [charged('Netflix', '2026-11-15', 23900)],
    });
    expect(v.pendingCents).toBe(150000);
    expect(v.futureCents).toBe(45000);
    expect(v.charges.map((c) => c.status)).toEqual(['charged', 'charged', 'pending', 'future']);
  });

  it('un cobro no realizado sale del proyectado y queda en la lista', () => {
    const v = thisMonth([netflix, renta, internet], [metro], {
      today,
      confirmations: [charged('Netflix', '2026-11-15', 23900), skipped('Renta', '2026-11-20')],
    });
    expect(v.doneCents).toBe(33900);
    expect(v.projectedCents).toBe(78900);
    expect(v.charges.find((c) => c.id === 'Renta')?.status).toBe('skipped');
  });

  it('cobro anterior al registro cuenta como efectuado', () => {
    const gym = { ...rec('Gym', 50000, '2026-11-01', 'cash'), createdAt: '2026-11-10T12:00:00Z' };
    const v = buildThisMonthView({
      recurring: [gym],
      oneOffs: [],
      confirmations: [],
      year: 2026,
      month: 11,
      today,
      registeredOn,
    });
    expect(v.charges[0].status).toBe('charged');
    expect(v.doneCents).toBe(50000);
  });

  it('mes futuro: nada efectuado y todo proyectado', () => {
    const v = thisMonth([netflix, renta], [], { today, month: 12 });
    expect(v.doneCents).toBe(0);
    expect(v.projectedCents).toBe(171900);
  });

  it('ignora confirmaciones eliminadas', () => {
    const v = thisMonth([netflix], [], {
      today,
      confirmations: [{ ...charged('Netflix', '2026-11-15', 23900), deletedAt: '2026-11-16' }],
    });
    expect(v.charges[0]).toMatchObject({ status: 'pending', amountCents: 21900 });
  });
});

describe('orden de la lista', () => {
  it('mismo día: por hora de registro', () => {
    const tacos = one('Tacos', 32000, '2026-11-11', 'cash', { createdAt: '2026-11-11T20:20:00Z' });
    const super_ = one('Súper', 198000, '2026-11-11', 'cash', {
      createdAt: '2026-11-12T00:47:00Z',
    });
    expect(thisMonth([], [super_, tacos]).charges.map((c) => c.label)).toEqual(['Tacos', 'Súper']);
  });

  it('mismo día y hora: por nombre', () => {
    const a = one('Zapatos', 100, '2026-11-05', 'cash');
    const b = one('Agua', 100, '2026-11-05', 'cash');
    expect(thisMonth([], [a, b]).charges.map((c) => c.label)).toEqual(['Agua', 'Zapatos']);
  });

  it('invertir el orden', () => {
    const v = thisMonth([netflix, renta], [metro]);
    expect(sortCharges(v.charges, 'desc').map((c) => c.label)).toEqual([
      'Renta',
      'Netflix',
      'Recarga metro',
    ]);
    expect(sortCharges(v.charges, 'asc').map((c) => c.label)).toEqual(
      v.charges.map((c) => c.label),
    );
  });
});

describe('vista Promedio', () => {
  const today = '2026-11-11';
  const lookups = { methods, categories: CATEGORIES };

  it('proporcionales, únicos y subtotales', () => {
    const v = buildAverageView(
      [netflix, renta, internet, seguro],
      [metro],
      2026,
      11,
      today,
      lookups,
    );
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
      lookups,
    );
    expect(v.items[0].monthlyCents).toBe(33333);
    expect(v.totalCents).toBe(33333);
  });

  it('gasto aún no vigente', () => {
    expect(
      buildAverageView([rec('Futuro', 1000, '2026-12-10', 'bbva')], [], 2026, 11, today, lookups)
        .items,
    ).toEqual([]);
  });

  it('gasto vigente con fecha de fin dentro del mes', () => {
    const r = rec('Termina', 1000, '2026-01-01', 'bbva', 1, 'month', { endDate: '2026-11-05' });
    expect(buildAverageView([r], [], 2026, 11, today, lookups).items).toHaveLength(1);
    expect(buildAverageView([r], [], 2026, 12, today, lookups).items).toHaveLength(0);
  });

  it('gastos únicos de otro mes no aparecen', () => {
    expect(
      buildAverageView([], [one('Cine', 18000, '2026-10-30', 'bbva')], 2026, 11, today, lookups)
        .oneOffs,
    ).toEqual([]);
  });

  describe('pista del cobro real', () => {
    it('gasto anual visto en noviembre 2026', () => {
      const v = buildAverageView([seguro], [], 2026, 11, today, lookups);
      expect(v.items[0].nextCharge).toBe('2027-03-15');
    });

    it('referencia en un mes futuro', () => {
      const v = buildAverageView([internet], [], 2027, 1, today, lookups);
      expect(v.referenceDate).toBe('2027-01-01');
      expect(v.items[0].nextCharge).toBe('2027-01-28');
    });

    it('referencia en un mes pasado usa hoy', () => {
      expect(buildAverageView([internet], [], 2026, 10, today, lookups).referenceDate).toBe(
        '2026-11-11',
      );
    });

    it('los mensuales no llevan pista', () => {
      const v = buildAverageView([netflix], [], 2026, 11, today, lookups);
      expect(v.items[0]).not.toHaveProperty('nextCharge');
    });

    it('sin cobros próximos', () => {
      const r = rec('Semestral', 1000, '2026-01-01', 'bbva', 6, 'month', { endDate: '2026-06-30' });
      const v = buildAverageView([r], [], 2026, 6, today, lookups);
      expect(v.items[0].nextCharge).toBeNull();
    });
  });
});

describe('repartos de Análisis', () => {
  const today = '2026-11-11';
  const lookups = { methods, categories: CATEGORIES };
  const cat = (name: string) => CATEGORIES.find((c) => c.name === name)!.id;

  it('costo mensual por método con prorrateo, igual al total', () => {
    const v = buildAverageView(
      [netflix, renta, internet, seguro],
      [metro],
      2026,
      11,
      today,
      lookups,
    );
    expect(v.byMethod.map((b) => [b.method?.name, b.amountCents])).toEqual([
      ['Nu Débito', 172500],
      ['BBVA Azul', 71900],
      ['Efectivo', 10000],
    ]);
    expect(v.byMethod.reduce((s, b) => s + b.amountCents, 0)).toBe(v.totalCents);
  });

  it('suma física y digital en una sola línea por método', () => {
    const v = buildAverageView(
      [rec('Netflix', 21900, '2026-01-15', 'bbva', 1, 'month', { cardVariant: 'digital' })],
      [one('Farmacia', 23850, '2026-11-09', 'bbva', { cardVariant: 'physical' })],
      2026,
      11,
      today,
      lookups,
    );
    expect(v.byMethod).toEqual([
      expect.objectContaining({ paymentMethodId: 'bbva', amountCents: 45750 }),
    ]);
  });

  it('incluye métodos archivados y desconocidos', () => {
    const archived = method('old', 'Banamex Clásica', { archivedAt: '2026-10-01T00:00:00Z' });
    const v = buildAverageView(
      [rec('Servicio', 240000, '2026-05-10', 'old', 6)],
      [one('X', 500, '2026-11-01', 'ghost')],
      2026,
      11,
      today,
      { methods: [...methods, archived], categories: CATEGORIES },
    );
    expect(v.byMethod).toEqual([
      { paymentMethodId: 'old', method: archived, amountCents: 40000 },
      { paymentMethodId: 'ghost', method: null, amountCents: 500 },
    ]);
  });

  it('reparto por categoría, de mayor a menor, igual al total', () => {
    const v = buildAverageView(
      [
        { ...renta, categoryId: cat('Hogar') },
        { ...seguro, categoryId: cat('Transporte') },
        { ...internet, categoryId: cat('Servicios') },
        { ...netflix, categoryId: cat('Suscripciones') },
      ],
      [{ ...metro, categoryId: cat('Transporte') }],
      2026,
      11,
      today,
      lookups,
    );
    expect(v.byCategory.map((c) => [c.category.name, c.amountCents])).toEqual([
      ['Hogar', 150000],
      ['Transporte', 60000],
      ['Servicios', 22500],
      ['Suscripciones', 21900],
    ]);
    expect(v.byCategory.reduce((s, c) => s + c.amountCents, 0)).toBe(v.totalCents);
  });

  it('una categoría borrada suma en "Otro"', () => {
    const v = buildAverageView(
      [{ ...netflix, categoryId: 'borrada' }],
      [metro],
      2026,
      11,
      today,
      lookups,
    );
    expect(v.byCategory).toEqual([
      { category: expect.objectContaining({ id: OTHER_CATEGORY_ID }), amountCents: 31900 },
    ]);
  });
});
