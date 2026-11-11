import {
  dueDateCoveredBy,
  lastDueOnOrBefore,
  nextDueOnOrAfter,
  pendingCardPayment,
  usedCents,
  validateCardPayment,
  type ChargedRef,
} from '../creditCard';

const card = {
  id: 'bbva',
  kind: 'credit' as const,
  openingBalanceCents: 1200000,
  openingBalanceDate: '2026-11-01',
  paymentDueDay: 5,
};
const one = (
  amountCents: number,
  date: string,
  deletedAt: string | null = null,
  paymentMethodId = 'bbva',
) => ({
  paymentMethodId,
  amountCents,
  date,
  deletedAt,
});
const charged = (
  amountCents: number,
  occurrenceDate: string,
  status: 'charged' | 'skipped' = 'charged',
): ChargedRef => ({
  status,
  amountCents: status === 'charged' ? amountCents : null,
  occurrenceDate,
  paymentMethodId: 'bbva',
  deletedAt: null,
});
const pay = (
  amountCents: number,
  forDueDate: string | null = null,
  deletedAt: string | null = null,
) => ({
  paymentMethodId: 'bbva',
  amountCents,
  forDueDate,
  deletedAt,
});

describe('usedCents', () => {
  it('saldo inicial + únicos + cobros confirmados', () => {
    expect(usedCents(card, [one(23850, '2026-11-09')], [charged(21900, '2026-11-15')], [])).toBe(
      1245750,
    );
  });

  it('un cobro sin confirmar o descartado no cuenta', () => {
    expect(usedCents(card, [], [], [])).toBe(1200000);
    expect(usedCents(card, [], [charged(21900, '2026-11-15', 'skipped')], [])).toBe(1200000);
  });

  it('gastos anteriores al saldo inicial no cuentan; los del mismo día sí', () => {
    expect(usedCents(card, [one(5000, '2026-10-30'), one(1000, '2026-11-01')], [], [])).toBe(
      1201000,
    );
  });

  it('ignora gastos de otras tarjetas y eliminados', () => {
    expect(
      usedCents(
        card,
        [one(5000, '2026-11-02', null, 'nu'), one(7000, '2026-11-02', '2026-11-03')],
        [],
        [],
      ),
    ).toBe(1200000);
  });

  it('pago total, parcial y saldo a favor', () => {
    const base = [one(23850, '2026-11-09')];
    const conf = [charged(21900, '2026-11-15')];
    expect(usedCents(card, base, conf, [pay(1245750)])).toBe(0);
    expect(usedCents(card, base, conf, [pay(500000)])).toBe(745750);
    expect(usedCents({ ...card, openingBalanceCents: 50000 }, [], [], [pay(70000)])).toBe(-20000);
  });

  it('un pago eliminado deja de restar', () => {
    expect(usedCents(card, [], [], [pay(500000, null, '2026-11-20')])).toBe(1200000);
  });
});

describe('fechas de pago', () => {
  it('próximo pago', () => {
    expect(nextDueOnOrAfter(5, '2026-11-11')).toBe('2026-12-05');
    expect(nextDueOnOrAfter(5, '2026-11-05')).toBe('2026-11-05');
    expect(nextDueOnOrAfter(31, '2026-11-01')).toBe('2026-11-30');
    expect(nextDueOnOrAfter(31, '2026-12-01')).toBe('2026-12-31');
  });

  it('última fecha de pago', () => {
    expect(lastDueOnOrBefore(5, '2026-12-05')).toBe('2026-12-05');
    expect(lastDueOnOrBefore(5, '2026-12-04')).toBe('2026-11-05');
    expect(lastDueOnOrBefore(31, '2027-02-28')).toBe('2027-02-28');
  });

  it('un pago cubre la fecha de pago más cercana', () => {
    expect(dueDateCoveredBy(card, '2026-12-03')).toBe('2026-12-05');
    expect(dueDateCoveredBy(card, '2026-11-07')).toBe('2026-11-05');
    expect(dueDateCoveredBy(card, '2026-12-05')).toBe('2026-12-05');
    expect(dueDateCoveredBy({ paymentDueDay: null }, '2026-12-05')).toBeNull();
  });
});

describe('pendingCardPayment (aviso)', () => {
  it('avisa al llegar la fecha de pago sin pago que la cubra', () => {
    expect(pendingCardPayment(card, [], '2026-12-05', 745750)).toEqual({
      dueDate: '2026-12-05',
      suggestedCents: 745750,
    });
  });

  it('pagar antes de la fecha evita el aviso', () => {
    const p = validateCardPayment({ amountText: '1000', date: '2026-12-03' }, card);
    expect(p.ok && p.value.forDueDate).toBe('2026-12-05');
    const payments = p.ok ? [{ ...p.value, deletedAt: null }] : [];
    expect(pendingCardPayment(card, payments, '2026-12-05', 645750)).toBeNull();
  });

  it('sin aviso con usado en cero o a favor, sin día de pago, o antes del saldo inicial', () => {
    expect(pendingCardPayment(card, [], '2026-12-05', 0)).toBeNull();
    expect(pendingCardPayment(card, [], '2026-12-05', -100)).toBeNull();
    expect(pendingCardPayment({ ...card, paymentDueDay: null }, [], '2026-12-05', 100)).toBeNull();
    expect(
      pendingCardPayment({ ...card, openingBalanceDate: '2026-11-10' }, [], '2026-11-20', 100),
    ).toBeNull();
  });

  it('solo aplica a tarjetas de crédito', () => {
    expect(pendingCardPayment({ ...card, kind: 'debit' }, [], '2026-12-05', 100)).toBeNull();
  });

  it('un pago eliminado vuelve a dejar el aviso', () => {
    expect(
      pendingCardPayment(card, [pay(1000, '2026-12-05', '2026-12-06')], '2026-12-06', 100),
    ).toEqual({
      dueDate: '2026-12-05',
      suggestedCents: 100,
    });
  });
});

describe('validateCardPayment', () => {
  it('monto obligatorio y positivo', () => {
    expect(validateCardPayment({ amountText: '', date: '2026-12-01' }, card)).toEqual({
      ok: false,
      errors: { amount: 'required' },
    });
    expect(validateCardPayment({ amountText: '0', date: '2026-12-01' }, card)).toEqual({
      ok: false,
      errors: { amount: 'not_positive' },
    });
  });

  it('desde el aviso cubre la fecha preguntada', () => {
    const r = validateCardPayment(
      { amountText: '500', date: '2026-12-20', forDueDate: '2026-12-05' },
      card,
    );
    expect(r.ok && r.value.forDueDate).toBe('2026-12-05');
  });
});

it('la distancia usa días reales', () => {
  // Día de pago 10: del 10 abr al 10 may hay 30 días; el 25 abr está a 15 de cada uno → empate → la posterior.
  expect(dueDateCoveredBy({ paymentDueDay: 10 }, '2027-04-25')).toBe('2027-05-10');
  expect(dueDateCoveredBy({ paymentDueDay: 10 }, '2027-04-24')).toBe('2027-04-10');
  // Del 28 ene al 28 feb hay 31 días: el 13 feb está a 16 y a 15 → el 28 feb.
  expect(dueDateCoveredBy({ paymentDueDay: 28 }, '2027-02-13')).toBe('2027-02-28');
});

it('física y digital suman al mismo usado', () => {
  const c = { ...card, openingBalanceCents: 0 };
  const ones = [
    { ...one(10000, '2026-11-02'), cardVariant: 'physical' as const },
    { ...one(5000, '2026-11-03'), cardVariant: 'digital' as const },
  ];
  expect(usedCents(c, ones, [], [])).toBe(15000);
});
