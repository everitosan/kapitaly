import {
  frequencyLabel,
  monthsPerInterval,
  presetFor,
  validateRecurringExpenseInput,
  type RecurringExpenseDraft,
} from '../recurringExpense';

const ctx = { isActiveMethod: (id: string) => id === 'bbva' };

const draft = (over: Partial<RecurringExpenseDraft> = {}): RecurringExpenseDraft => ({
  name: 'Netflix',
  amountText: '219',
  intervalUnit: 'month',
  intervalCount: 1,
  anchorDate: '2026-11-15',
  endDate: null,
  paymentMethodId: 'bbva',
  ...over,
});

describe('frecuencias', () => {
  it('normaliza a meses', () => {
    expect(monthsPerInterval('month', 2)).toBe(2);
    expect(monthsPerInterval('year', 1)).toBe(12);
    expect(monthsPerInterval('year', 2)).toBe(24);
  });

  it('mapea presets y "cada N meses"', () => {
    expect(presetFor('month', 1)).toBe('monthly');
    expect(presetFor('month', 6)).toBe('semiannual');
    expect(presetFor('month', 4)).toBe('custom');
    expect(frequencyLabel('month', 4)).toBe('Cada 4 meses');
    expect(frequencyLabel('month', 3)).toBe('Trimestral');
  });

  it('12 meses o anual se muestran como Anual', () => {
    expect(presetFor('month', 12)).toBe('annual');
    expect(presetFor('year', 1)).toBe('annual');
    expect(frequencyLabel('month', 12)).toBe('Anual');
  });
});

describe('validateRecurringExpenseInput', () => {
  it('alta exitosa con método de pago', () => {
    expect(validateRecurringExpenseInput(draft({ name: ' Netflix ' }), ctx)).toEqual({
      ok: true,
      value: {
        name: 'Netflix',
        amountCents: 21900,
        intervalUnit: 'month',
        intervalCount: 1,
        anchorDate: '2026-11-15',
        endDate: null,
        paymentMethodId: 'bbva',
        cardVariant: null,
      },
    });
  });

  it('monto cero', () => {
    const r = validateRecurringExpenseInput(draft({ amountText: '0.00' }), ctx);
    expect(r).toEqual({ ok: false, errors: { amount: 'not_positive' } });
  });

  it('monto con más de dos decimales o vacío', () => {
    expect(validateRecurringExpenseInput(draft({ amountText: '10.555' }), ctx)).toEqual({
      ok: false,
      errors: { amount: 'too_many_decimals' },
    });
    expect(validateRecurringExpenseInput(draft({ amountText: '' }), ctx)).toEqual({
      ok: false,
      errors: { amount: 'required' },
    });
  });

  it('nombre con solo espacios', () => {
    expect(validateRecurringExpenseInput(draft({ name: '   ' }), ctx)).toEqual({
      ok: false,
      errors: { name: 'required' },
    });
  });

  it('fecha de fin anterior a la fecha de cobro', () => {
    const r = validateRecurringExpenseInput(
      draft({ anchorDate: '2026-05-10', endDate: '2026-05-01' }),
      ctx,
    );
    expect(r).toEqual({ ok: false, errors: { endDate: 'before_anchor' } });
  });

  it('acepta fecha de fin igual o posterior', () => {
    expect(
      validateRecurringExpenseInput(draft({ anchorDate: '2026-01-01', endDate: '2026-03-31' }), ctx)
        .ok,
    ).toBe(true);
  });

  it('falta la fecha de cobro', () => {
    expect(validateRecurringExpenseInput(draft({ anchorDate: null }), ctx)).toEqual({
      ok: false,
      errors: { anchorDate: 'required' },
    });
  });

  it('intervalo inválido', () => {
    expect(validateRecurringExpenseInput(draft({ intervalCount: 0 }), ctx).ok).toBe(false);
    expect(validateRecurringExpenseInput(draft({ intervalCount: 1.5 }), ctx).ok).toBe(false);
  });

  it('sin método de pago o con uno inactivo', () => {
    expect(validateRecurringExpenseInput(draft({ paymentMethodId: null }), ctx)).toEqual({
      ok: false,
      errors: { paymentMethodId: 'required' },
    });
    expect(validateRecurringExpenseInput(draft({ paymentMethodId: 'archivado' }), ctx).ok).toBe(
      false,
    );
  });

  it('reporta todos los errores a la vez', () => {
    const r = validateRecurringExpenseInput(
      draft({ name: '', amountText: 'x', paymentMethodId: null }),
      ctx,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['amount', 'name', 'paymentMethodId']);
  });
});

describe('variante de tarjeta en gastos', () => {
  const withDigital = { ...ctx, methodHasDigital: (id: string) => id === 'bbva' };

  it('si el método tiene digital, guarda la variante elegida (o "Física" por defecto)', () => {
    const d = validateRecurringExpenseInput(draft({ cardVariant: 'digital' }), withDigital);
    expect(d.ok && d.value.cardVariant).toBe('digital');
    const p = validateRecurringExpenseInput(draft(), withDigital);
    expect(p.ok && p.value.cardVariant).toBe('physical');
  });

  it('si el método no tiene digital, la variante es null', () => {
    const r = validateRecurringExpenseInput(draft({ cardVariant: 'digital' }), ctx);
    expect(r.ok && r.value.cardVariant).toBeNull();
  });
});
