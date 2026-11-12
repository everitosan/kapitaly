import { OTHER_CATEGORY_ID } from '../category';
import { validateOneOffExpenseInput, type OneOffExpenseDraft } from '../oneOffExpense';

const ctx = { isActiveMethod: (id: string) => id === 'efectivo' };
const draft = (over: Partial<OneOffExpenseDraft> = {}): OneOffExpenseDraft => ({
  description: 'Recarga metro',
  amountText: '100',
  date: '2026-11-11',
  paymentMethodId: 'efectivo',
  ...over,
});

describe('validateOneOffExpenseInput', () => {
  it('alta rápida', () => {
    expect(validateOneOffExpenseInput(draft(), ctx)).toEqual({
      ok: true,
      value: {
        description: 'Recarga metro',
        amountCents: 10000,
        date: '2026-11-11',
        paymentMethodId: 'efectivo',
        cardVariant: null,
        addsToCardBalance: true,
        categoryId: OTHER_CATEGORY_ID,
      },
    });
  });

  it('sin elegir categoría queda en "Otro"; con una elegida, la conserva', () => {
    const r = validateOneOffExpenseInput(draft(), ctx);
    expect(r.ok && r.value.categoryId).toBe(OTHER_CATEGORY_ID);
    const s = validateOneOffExpenseInput({ ...draft(), categoryId: 'comida' }, ctx);
    expect(s.ok && s.value.categoryId).toBe('comida');
  });

  it('respeta "no sumar al saldo de la tarjeta"', () => {
    const r = validateOneOffExpenseInput({ ...draft(), addsToCardBalance: false }, ctx);
    expect(r.ok && r.value.addsToCardBalance).toBe(false);
  });

  it('descripción vacía', () => {
    expect(validateOneOffExpenseInput(draft({ description: '  ' }), ctx)).toEqual({
      ok: false,
      errors: { description: 'required' },
    });
  });

  it('monto con más de dos decimales', () => {
    expect(validateOneOffExpenseInput(draft({ amountText: '10.555' }), ctx)).toEqual({
      ok: false,
      errors: { amount: 'too_many_decimals' },
    });
  });

  it('monto no positivo', () => {
    expect(validateOneOffExpenseInput(draft({ amountText: '0' }), ctx)).toEqual({
      ok: false,
      errors: { amount: 'not_positive' },
    });
  });

  it('falta la fecha', () => {
    expect(validateOneOffExpenseInput(draft({ date: null }), ctx)).toEqual({
      ok: false,
      errors: { date: 'required' },
    });
  });

  it('sin método de pago activo', () => {
    expect(validateOneOffExpenseInput(draft({ paymentMethodId: null }), ctx)).toEqual({
      ok: false,
      errors: { paymentMethodId: 'required' },
    });
  });

  it('conserva los centavos exactos', () => {
    const r = validateOneOffExpenseInput(draft({ amountText: '238.50' }), ctx);
    expect(r.ok && r.value.amountCents).toBe(23850);
  });
});

it('gasto único con la tarjeta digital', () => {
  const r = validateOneOffExpenseInput(draft({ cardVariant: 'digital' }), {
    ...ctx,
    methodHasDigital: () => true,
  });
  expect(r.ok && r.value.cardVariant).toBe('digital');
});
