import { formatDayMonth, formatDetailDate, formatLongDate, formatWeekdayDate } from '../format';

describe('formatDetailDate', () => {
  it('omite el año si es el del mes consultado', () => {
    expect(formatDetailDate('2026-11-08', 2026)).toBe('8 nov');
  });

  it('muestra el año si es de otro año', () => {
    expect(formatDetailDate('2027-03-15', 2026)).toBe('15 mar 2027');
  });

  it('usa un guion si no hay fecha', () => {
    expect(formatDetailDate(null, 2026)).toBe('—');
  });
});

describe('formatLongDate', () => {
  it('escribe el mes completo', () => {
    expect(formatLongDate('2027-03-15')).toBe('15 de marzo de 2027');
  });
});

describe('fechas del gasto por día', () => {
  it('día de la semana con fecha corta', () => {
    expect(formatWeekdayDate('2026-11-07')).toBe('Sábado 7 nov');
    expect(formatWeekdayDate('2026-11-12')).toBe('Jueves 12 nov');
    expect(formatWeekdayDate('2027-01-01')).toBe('Viernes 1 ene');
  });

  it('día y mes para el lector de pantalla', () => {
    expect(formatDayMonth('2026-11-07')).toBe('7 de noviembre');
  });
});
