import {
  isActiveSnooze,
  msUntilNextExpiry,
  SHEET_SNOOZE_KEY,
  SNOOZE_HOURS,
  snoozeUntil,
} from '../pendingSnooze';

const at = (h: number, m = 0) => new Date(Date.UTC(2026, 10, 14, h, m)).toISOString();

describe('posponer pendientes', () => {
  it('el plazo es de 6 horas', () => {
    expect(SNOOZE_HOURS).toBe(6);
    expect(snoozeUntil(at(10))).toBe(at(16));
    expect(SHEET_SNOOZE_KEY).toBe('sheet');
  });

  it('sigue vigente a las 5:59 h y vence a las 6:00 h', () => {
    const snooze = { until: snoozeUntil(at(10)) };
    expect(isActiveSnooze(snooze, at(13))).toBe(true);
    expect(isActiveSnooze(snooze, at(15, 59))).toBe(true);
    expect(isActiveSnooze(snooze, at(16))).toBe(false);
    expect(isActiveSnooze(snooze, at(16, 5))).toBe(false);
  });

  it('calcula cuánto falta para el próximo vencimiento', () => {
    const snoozes = [
      { key: 'a', until: at(16) },
      { key: 'b', until: at(12) },
      { key: 'c', until: at(9) },
    ];
    expect(msUntilNextExpiry(snoozes, at(11))).toBe(60 * 60 * 1000);
    expect(msUntilNextExpiry(snoozes, at(17))).toBeNull();
  });
});
