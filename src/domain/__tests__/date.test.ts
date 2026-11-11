import {
  addMonthsClamped,
  civilDateFromLocal,
  clampedDate,
  compareCivilDates,
  daysInMonth,
  formatCivilDate,
  isInMonth,
  isValidCivilDate,
  lastDayOfMonth,
  parseCivilDate,
  shiftMonth,
} from '../date';

describe('fechas civiles', () => {
  it('parsea y formatea YYYY-MM-DD', () => {
    expect(parseCivilDate('2026-11-05')).toEqual({ year: 2026, month: 11, day: 5 });
    expect(formatCivilDate(2026, 1, 9)).toBe('2026-01-09');
  });

  it('rechaza fechas inexistentes o mal formadas', () => {
    expect(isValidCivilDate('2026-02-29')).toBe(false);
    expect(isValidCivilDate('2028-02-29')).toBe(true);
    expect(isValidCivilDate('2026-13-01')).toBe(false);
    expect(isValidCivilDate('2026-4-01')).toBe(false);
    expect(() => parseCivilDate('2026-11-31')).toThrow();
  });

  it('calcula los días de cada mes, incluidos bisiestos', () => {
    expect(daysInMonth(2026, 11)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
    expect(daysInMonth(2027, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2100, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
  });

  it('compara fechas', () => {
    expect(compareCivilDates('2026-01-31', '2026-02-01')).toBeLessThan(0);
    expect(compareCivilDates('2026-02-01', '2026-02-01')).toBe(0);
    expect(compareCivilDates('2027-01-01', '2026-12-31')).toBeGreaterThan(0);
  });

  it('obtiene la fecha local desde un Date', () => {
    expect(civilDateFromLocal(new Date(2026, 10, 11, 23, 59))).toBe('2026-11-11');
  });

  it('desplaza meses cruzando años', () => {
    expect(shiftMonth(2026, 11, 2)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth(2026, 3, -27)).toEqual({ year: 2023, month: 12 });
  });

  describe('suma de meses con ajuste al último día', () => {
    it('31 → 30 en un mes de 30 días', () => {
      expect(addMonthsClamped('2026-10-31', 1)).toBe('2026-11-30');
    });

    it('recupera el día original después de un mes corto', () => {
      expect(addMonthsClamped('2026-10-31', 2)).toBe('2026-12-31');
      expect(addMonthsClamped('2027-01-30', 1)).toBe('2027-02-28');
      expect(addMonthsClamped('2027-01-30', 2)).toBe('2027-03-30');
    });

    it('29 de febrero en años bisiestos y no bisiestos', () => {
      expect(addMonthsClamped('2028-02-29', 12)).toBe('2029-02-28');
      expect(addMonthsClamped('2028-02-29', 48)).toBe('2032-02-29');
    });

    it('ajusta un día concreto al tamaño del mes', () => {
      expect(clampedDate(2026, 2, 31)).toBe('2026-02-28');
      expect(lastDayOfMonth(2028, 2)).toBe('2028-02-29');
    });
  });

  it('sabe si una fecha cae en un mes', () => {
    expect(isInMonth('2026-11-30', 2026, 11)).toBe(true);
    expect(isInMonth('2026-12-01', 2026, 11)).toBe(false);
  });
});
