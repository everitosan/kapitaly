import {
  canArchive,
  canRemove,
  CASH_METHOD_ID,
  countMethodUses,
  INITIAL_CASH_METHOD,
  methodLabel,
  NO_CARD_DATA,
  suggestCardVariant,
  suggestPaymentMethod,
  validatePaymentMethodInput,
  type ExpenseRef,
  type PaymentMethod,
} from '../paymentMethod';

const ctx = {
  isPayInstitution: (id: string) => ['bbva-mx', 'nu-mx'].includes(id),
  today: '2026-11-01',
};

const method = (over: Partial<PaymentMethod> & { id: string }): PaymentMethod => ({
  name: over.id,
  kind: 'credit',
  institutionId: null,
  last4: null,
  color: 'cobalt',
  archivedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deletedAt: null,
  ...NO_CARD_DATA,
  ...over,
});

const expense = (
  paymentMethodId: string,
  createdAt: string,
  deletedAt: string | null = null,
): ExpenseRef => ({
  paymentMethodId,
  createdAt,
  deletedAt,
});

describe('validatePaymentMethodInput', () => {
  it('alta de tarjeta con institución', () => {
    const r = validatePaymentMethodInput(
      { name: ' BBVA Azul ', kind: 'credit', institutionId: 'bbva-mx', last4: '4521', color: null },
      ctx,
    );
    expect(r).toEqual({
      ok: true,
      value: {
        name: 'BBVA Azul',
        kind: 'credit',
        institutionId: 'bbva-mx',
        last4: '4521',
        color: null,
        openingBalanceCents: 0,
        openingBalanceDate: '2026-11-01',
        creditLimitCents: null,
        paymentDueDay: null,
        hasDigital: false,
        digitalLast4: null,
      },
    });
    if (r.ok) expect(methodLabel(r.value)).toBe('BBVA Azul ••4521');
  });

  it('alta sin institución con color de la paleta', () => {
    const r = validatePaymentMethodInput(
      { name: 'Tarjeta de la tienda', kind: 'credit', color: 'peach' },
      ctx,
    );
    expect(r.ok && r.value).toMatchObject({ institutionId: null, color: 'peach' });
  });

  it('sin institución exige color de la paleta', () => {
    const r = validatePaymentMethodInput({ name: 'Tienda', kind: 'credit', color: null }, ctx);
    expect(r).toEqual({ ok: false, errors: { color: 'required' } });
  });

  it('dígitos inválidos', () => {
    const r = validatePaymentMethodInput(
      { name: 'X', kind: 'debit', last4: '45A', color: 'lime' },
      ctx,
    );
    expect(r).toEqual({ ok: false, errors: { last4: 'four_digits' } });
    expect(
      validatePaymentMethodInput({ name: 'X', kind: 'debit', last4: '123', color: 'lime' }, ctx).ok,
    ).toBe(false);
  });

  it('nombre vacío', () => {
    const r = validatePaymentMethodInput({ name: '   ', kind: 'debit', color: 'lime' }, ctx);
    expect(r).toEqual({ ok: false, errors: { name: 'required' } });
  });

  it('rechaza instituciones que no sirven para pagar', () => {
    const r = validatePaymentMethodInput(
      { name: 'Cetes', kind: 'debit', institutionId: 'cetes-mx' },
      ctx,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.institutionId).toBe('not_for_payments');
  });

  it('el efectivo descarta institución y dígitos', () => {
    const r = validatePaymentMethodInput(
      { name: 'Efectivo', kind: 'cash', institutionId: 'bbva-mx', last4: '1111', color: 'mint' },
      ctx,
    );
    expect(r.ok && r.value).toMatchObject({ institutionId: null, last4: null });
  });

  it('el método inicial "Efectivo" es válido y tiene un id fijo', () => {
    expect(validatePaymentMethodInput(INITIAL_CASH_METHOD, ctx).ok).toBe(true);
    expect(CASH_METHOD_ID).toBe('00000000-0000-4000-8000-000000000001');
  });
});

describe('reglas de archivado y eliminación', () => {
  const methods = [
    method({ id: 'bbva' }),
    method({ id: 'nu' }),
    method({ id: 'old', archivedAt: '2026-05-01T00:00:00Z' }),
  ];

  it('archivar un método en uso está permitido', () => {
    expect(canArchive('bbva', methods)).toEqual({ ok: true });
  });

  it('eliminar un método sin uso está permitido', () => {
    expect(canRemove('nu', methods, [expense('bbva', '2026-02-01')])).toEqual({ ok: true });
  });

  it('no se elimina un método en uso; se informa cuántos gastos lo usan', () => {
    const expenses = [
      expense('bbva', '2026-02-01'),
      expense('bbva', '2026-03-01'),
      expense('bbva', '2026-04-01', '2026-04-02'),
    ];
    expect(canRemove('bbva', methods, expenses)).toEqual({ ok: false, reason: 'in_use', uses: 2 });
  });

  it('los gastos eliminados no cuentan como uso', () => {
    expect(countMethodUses('nu', [expense('nu', '2026-01-01', '2026-01-02')])).toBe(0);
    expect(canRemove('nu', methods, [expense('nu', '2026-01-01', '2026-01-02')])).toEqual({
      ok: true,
    });
  });

  it('impide archivar o eliminar el último método activo', () => {
    const one = [method({ id: 'solo' }), method({ id: 'old', archivedAt: '2026-05-01T00:00:00Z' })];
    expect(canArchive('solo', one)).toEqual({ ok: false, reason: 'last_active' });
    expect(canRemove('solo', one, [])).toEqual({ ok: false, reason: 'last_active' });
  });

  it('un método archivado sin uso se puede eliminar aunque quede un solo activo', () => {
    const one = [method({ id: 'solo' }), method({ id: 'old', archivedAt: '2026-05-01T00:00:00Z' })];
    expect(canRemove('old', one, [])).toEqual({ ok: true });
  });

  it('reporta métodos inexistentes', () => {
    expect(canArchive('nope', methods)).toEqual({ ok: false, reason: 'not_found' });
  });
});

describe('suggestPaymentMethod', () => {
  const methods = [
    method({ id: CASH_METHOD_ID, kind: 'cash' }),
    method({ id: 'bbva', createdAt: '2026-01-02T00:00:00Z' }),
    method({ id: 'nu', createdAt: '2026-01-03T00:00:00Z' }),
  ];

  it('preselecciona el método del último gasto registrado', () => {
    const expenses = [
      expense('bbva', '2026-11-01T10:00:00Z'),
      expense('nu', '2026-11-08T10:00:00Z'),
    ];
    expect(suggestPaymentMethod(methods, expenses)).toBe('nu');
  });

  it('salta gastos eliminados y métodos archivados', () => {
    const withArchived = methods.map((m) =>
      m.id === 'nu' ? { ...m, archivedAt: '2026-11-09T00:00:00Z' } : m,
    );
    const expenses = [
      expense('bbva', '2026-11-01T10:00:00Z'),
      expense('nu', '2026-11-08T10:00:00Z'),
      expense(CASH_METHOD_ID, '2026-11-10T10:00:00Z', '2026-11-10T11:00:00Z'),
    ];
    expect(suggestPaymentMethod(withArchived, expenses)).toBe('bbva');
  });

  it('sin gastos sugiere "Efectivo"', () => {
    expect(suggestPaymentMethod(methods, [])).toBe(CASH_METHOD_ID);
  });

  it('sin "Efectivo" activo sugiere el primer método activo', () => {
    const noCash = methods.map((m) =>
      m.id === CASH_METHOD_ID ? { ...m, deletedAt: '2026-02-01T00:00:00Z' } : m,
    );
    expect(suggestPaymentMethod(noCash, [])).toBe('bbva');
  });
});

describe('datos de tarjeta de crédito', () => {
  const credit = { name: 'BBVA Azul', kind: 'credit' as const, institutionId: 'bbva-mx' };

  it('alta con saldo inicial, límite y día de pago', () => {
    const r = validatePaymentMethodInput(
      { ...credit, openingBalanceText: '12,000', creditLimitText: '50,000.00', paymentDueDay: 5 },
      ctx,
    );
    expect(r.ok && r.value).toMatchObject({
      openingBalanceCents: 1200000,
      openingBalanceDate: '2026-11-01',
      creditLimitCents: 5000000,
      paymentDueDay: 5,
    });
  });

  it('día de pago fuera de 1 a 31', () => {
    for (const day of [0, 32, 2.5]) {
      const r = validatePaymentMethodInput({ ...credit, paymentDueDay: day }, ctx);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors.paymentDueDay).toBe('invalid');
    }
  });

  it('saldo inicial con más de dos decimales o inválido; límite no positivo', () => {
    const a = validatePaymentMethodInput({ ...credit, openingBalanceText: '10.555' }, ctx);
    expect(!a.ok && a.errors.openingBalance).toBe('too_many_decimals');
    const b = validatePaymentMethodInput({ ...credit, openingBalanceText: '-5' }, ctx);
    expect(!b.ok && b.errors.openingBalance).toBe('invalid');
    const c = validatePaymentMethodInput({ ...credit, creditLimitText: '0' }, ctx);
    expect(!c.ok && c.errors.creditLimit).toBe('not_positive');
  });

  it('conserva la fecha del saldo inicial al editar', () => {
    const r = validatePaymentMethodInput(
      { ...credit, openingBalanceText: '100', openingBalanceDate: '2026-10-01' },
      ctx,
    );
    expect(r.ok && r.value.openingBalanceDate).toBe('2026-10-01');
  });

  it('otros tipos descartan los datos de tarjeta', () => {
    const r = validatePaymentMethodInput(
      {
        name: 'Nu',
        kind: 'debit',
        institutionId: 'nu-mx',
        openingBalanceText: '500',
        creditLimitText: '1000',
        paymentDueDay: 5,
      },
      ctx,
    );
    expect(r.ok && r.value).toMatchObject(NO_CARD_DATA);
  });
});

describe('tarjeta digital', () => {
  const ctxPay = { isPayInstitution: () => true, today: '2026-11-01' };

  it('crédito o débito pueden registrar la versión digital con sus dígitos', () => {
    const r = validatePaymentMethodInput(
      {
        name: 'BBVA Azul',
        kind: 'credit',
        institutionId: 'bbva-mx',
        last4: '4521',
        hasDigital: true,
        digitalLast4: '7788',
      },
      ctxPay,
    );
    expect(r.ok && r.value).toMatchObject({
      last4: '4521',
      hasDigital: true,
      digitalLast4: '7788',
    });
    const d = validatePaymentMethodInput(
      { name: 'Nu', kind: 'debit', institutionId: 'nu-mx', hasDigital: true },
      ctxPay,
    );
    expect(d.ok && d.value).toMatchObject({ hasDigital: true, digitalLast4: null });
  });

  it('dígitos de la digital inválidos', () => {
    const r = validatePaymentMethodInput(
      {
        name: 'BBVA',
        kind: 'credit',
        institutionId: 'bbva-mx',
        hasDigital: true,
        digitalLast4: '77A',
      },
      ctxPay,
    );
    expect(!r.ok && r.errors.digitalLast4).toBe('four_digits');
  });

  it('efectivo y transferencia no tienen versión digital', () => {
    for (const kind of ['cash', 'transfer'] as const) {
      const r = validatePaymentMethodInput(
        { name: 'X', kind, color: 'mint', hasDigital: true, digitalLast4: '1111' },
        ctxPay,
      );
      expect(r.ok && r.value).toMatchObject({ hasDigital: false, digitalLast4: null });
    }
  });

  it('etiqueta con la variante', () => {
    const m = { name: 'BBVA Azul', last4: '4521', digitalLast4: '7788' };
    expect(methodLabel(m, 'digital')).toBe('BBVA Azul ••7788 · digital');
    expect(methodLabel(m, 'physical')).toBe('BBVA Azul ••4521');
    expect(methodLabel({ ...m, digitalLast4: null }, 'digital')).toBe('BBVA Azul · digital');
  });

  it('preselecciona la variante del último gasto con ese método', () => {
    const e = (
      cardVariant: 'physical' | 'digital' | null,
      createdAt: string,
      paymentMethodId = 'bbva',
    ) => ({
      paymentMethodId,
      createdAt,
      deletedAt: null,
      cardVariant,
    });
    expect(
      suggestCardVariant('bbva', [
        e('physical', '2026-11-01'),
        e('digital', '2026-11-05'),
        e('physical', '2026-11-09', 'nu'),
      ]),
    ).toBe('digital');
    expect(suggestCardVariant('bbva', [])).toBe('physical');
    expect(suggestCardVariant('bbva', [e(null, '2026-11-01')])).toBe('physical');
  });
});
