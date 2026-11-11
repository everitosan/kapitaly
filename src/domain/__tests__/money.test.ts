import {
  divideRoundHalfUp,
  formatCentsManual,
  formatMXN,
  formatMXNParts,
  parseMoneyToCents,
  sumCents,
} from '../money';

describe('parseMoneyToCents', () => {
  it.each([
    ['1500', 150000],
    ['1,500.50', 150050],
    ['1500.5', 150050],
    ['$219', 21900],
    ['$ 1,234,567.89', 123456789],
    ['0.10', 10],
    ['.5', 50],
    ['  100  ', 10000],
    ['0', 0],
  ])('convierte "%s" a %d centavos', (text, cents) => {
    expect(parseMoneyToCents(text)).toEqual({ ok: true, cents });
  });

  it('rechaza más de dos decimales', () => {
    expect(parseMoneyToCents('10.555')).toEqual({ ok: false, error: 'too_many_decimals' });
  });

  it.each(['', '   ', '$'])('marca "%s" como vacío', (text) => {
    expect(parseMoneyToCents(text)).toEqual({ ok: false, error: 'empty' });
  });

  it.each(['abc', '1.2.3', '1,50', '12,34.00', '-5', '1e3', '.', '1,500,00'])(
    'rechaza "%s" como inválido',
    (text) => {
      expect(parseMoneyToCents(text)).toEqual({ ok: false, error: 'invalid' });
    },
  );
});

describe('sumas exactas', () => {
  it('0.10 + 0.20 + 0.30 = 0.60 sin errores de redondeo', () => {
    const values = ['0.10', '0.20', '0.30'].map((t) => {
      const r = parseMoneyToCents(t);
      if (!r.ok) throw new Error('parse');
      return r.cents;
    });
    expect(sumCents(values)).toBe(60);
    expect(formatMXN(sumCents(values))).toBe('$0.60');
  });
});

describe('divideRoundHalfUp', () => {
  it('redondea a la mitad hacia arriba', () => {
    expect(divideRoundHalfUp(100000, 3)).toBe(33333); // $1,000 trimestral → $333.33
    expect(divideRoundHalfUp(45000, 2)).toBe(22500);
    expect(divideRoundHalfUp(600000, 12)).toBe(50000);
    expect(divideRoundHalfUp(5, 2)).toBe(3); // 2.5 → 3
    expect(divideRoundHalfUp(200, 3)).toBe(67); // 66.67 → 67
    expect(divideRoundHalfUp(100, 3)).toBe(33); // 33.33 → 33
  });

  it('rechaza divisores inválidos', () => {
    expect(() => divideRoundHalfUp(100, 0)).toThrow();
    expect(() => divideRoundHalfUp(100.5, 2)).toThrow();
  });
});

describe('formato MXN', () => {
  it('formatea en es-MX', () => {
    expect(formatMXN(150050)).toBe('$1,500.50');
    expect(formatMXN(21900)).toBe('$219.00');
    expect(formatMXN(0)).toBe('$0.00');
  });

  it('el formato manual coincide con Intl', () => {
    for (const c of [0, 5, 99, 100, 21900, 150050, 123456789]) {
      expect(formatCentsManual(c)).toBe(formatMXN(c));
    }
  });

  it('separa entero y centavos', () => {
    expect(formatMXNParts(785650)).toEqual(['$7,856', '.50']);
  });
});
