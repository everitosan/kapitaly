import { nextOccurrenceOnOrAfter, occurrenceInMonth } from '../schedule';
import type { IntervalUnit } from '../recurringExpense';

const rule = (
  anchorDate: string,
  intervalCount = 1,
  intervalUnit: IntervalUnit = 'month',
  endDate: string | null = null,
) => ({
  anchorDate,
  intervalCount,
  intervalUnit,
  endDate,
});

describe('occurrenceInMonth', () => {
  it('alta con fecha de fin: cobra de enero a marzo y no después', () => {
    const r = rule('2026-01-01', 1, 'month', '2026-03-31');
    expect(occurrenceInMonth(r, 2026, 1)).toBe('2026-01-01');
    expect(occurrenceInMonth(r, 2026, 3)).toBe('2026-03-01');
    expect(occurrenceInMonth(r, 2026, 4)).toBeNull();
  });

  it('semestral: 20 de enero y 20 de julio', () => {
    const r = rule('2026-01-20', 6);
    expect(occurrenceInMonth(r, 2026, 1)).toBe('2026-01-20');
    expect(occurrenceInMonth(r, 2026, 7)).toBe('2026-07-20');
    expect(occurrenceInMonth(r, 2027, 1)).toBe('2027-01-20');
    expect(occurrenceInMonth(r, 2026, 4)).toBeNull();
  });

  it('cada 4 meses: 5 de febrero, junio y octubre', () => {
    const r = rule('2026-02-05', 4);
    expect([2, 6, 10].map((m) => occurrenceInMonth(r, 2026, m))).toEqual([
      '2026-02-05',
      '2026-06-05',
      '2026-10-05',
    ]);
    expect(occurrenceInMonth(r, 2026, 4)).toBeNull();
  });

  it('bimestral desde el 28 de septiembre', () => {
    const r = rule('2026-09-28', 2);
    expect(occurrenceInMonth(r, 2026, 9)).toBe('2026-09-28');
    expect(occurrenceInMonth(r, 2026, 11)).toBe('2026-11-28');
    expect(occurrenceInMonth(r, 2027, 1)).toBe('2027-01-28');
    expect(occurrenceInMonth(r, 2026, 10)).toBeNull();
    expect(occurrenceInMonth(r, 2026, 12)).toBeNull();
  });

  it('sin cobros antes del ancla', () => {
    expect(occurrenceInMonth(rule('2026-12-10'), 2026, 11)).toBeNull();
  });

  it('día 31 en mes de 30 días y vuelta al 31', () => {
    const r = rule('2026-10-31');
    expect(occurrenceInMonth(r, 2026, 11)).toBe('2026-11-30');
    expect(occurrenceInMonth(r, 2026, 12)).toBe('2026-12-31');
  });

  it('febrero', () => {
    const r = rule('2027-01-30');
    expect(occurrenceInMonth(r, 2027, 2)).toBe('2027-02-28');
    expect(occurrenceInMonth(r, 2027, 3)).toBe('2027-03-30');
  });

  it('anual en 29 de febrero', () => {
    const r = rule('2028-02-29', 1, 'year');
    expect(occurrenceInMonth(r, 2029, 2)).toBe('2029-02-28');
    expect(occurrenceInMonth(r, 2032, 2)).toBe('2032-02-29');
    expect(occurrenceInMonth(r, 2029, 3)).toBeNull();
  });

  it('la fecha de fin dentro del mes corta el cobro si es anterior al día', () => {
    expect(occurrenceInMonth(rule('2026-01-20', 1, 'month', '2026-03-10'), 2026, 3)).toBeNull();
  });
});

describe('nextOccurrenceOnOrAfter', () => {
  it('seguro anual: próximo cobro el 15/03/2027 visto desde el 11/11/2026', () => {
    expect(nextOccurrenceOnOrAfter(rule('2026-03-15', 1, 'year'), '2026-11-11')).toBe('2027-03-15');
  });

  it('bimestral visto desde el 01/01/2027', () => {
    expect(nextOccurrenceOnOrAfter(rule('2026-09-28', 2), '2027-01-01')).toBe('2027-01-28');
  });

  it('incluye un cobro el mismo día', () => {
    expect(nextOccurrenceOnOrAfter(rule('2026-09-28', 2), '2026-11-28')).toBe('2026-11-28');
  });

  it('si el cobro del mes ya pasó, salta al siguiente intervalo', () => {
    expect(nextOccurrenceOnOrAfter(rule('2026-09-28', 2), '2026-11-29')).toBe('2027-01-28');
  });

  it('antes del ancla devuelve el ancla', () => {
    expect(nextOccurrenceOnOrAfter(rule('2026-12-10'), '2026-11-11')).toBe('2026-12-10');
  });

  it('sin cobros próximos por la fecha de fin', () => {
    expect(
      nextOccurrenceOnOrAfter(rule('2026-01-01', 6, 'month', '2026-06-30'), '2026-11-11'),
    ).toBeNull();
  });

  it('respeta el ajuste de fin de mes', () => {
    expect(nextOccurrenceOnOrAfter(rule('2026-01-31'), '2026-02-01')).toBe('2026-02-28');
  });
});
