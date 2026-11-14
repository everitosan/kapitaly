import {
  activeReminderCount,
  DEFAULT_REMINDER_SETTINGS,
  effectiveIdleTime,
  formatClockTime,
  isClockTime,
  parseClockTime,
  validateReminderSettings,
} from '../reminderSettings';

describe('preferencias de notificaciones', () => {
  it('vienen apagadas, con 10:00, 21:00 y 3 días por omisión', () => {
    expect(DEFAULT_REMINDER_SETTINGS).toEqual({
      chargesOn: false,
      chargesTime: '10:00',
      dailyOn: false,
      dailyTime: '21:00',
      idleOn: false,
      idleDays: 3,
      idleTime: null,
    });
    expect(activeReminderCount(DEFAULT_REMINDER_SETTINGS)).toBe(0);
  });

  it.each([
    ['00:00', true],
    ['09:05', true],
    ['23:59', true],
    ['24:00', false],
    ['9:00', false],
    ['12:60', false],
    ['', false],
  ])('hora %s válida: %s', (value, ok) => {
    expect(isClockTime(value)).toBe(ok);
  });

  it('separa y arma horas', () => {
    expect(parseClockTime('20:30')).toEqual({ hour: 20, minute: 30 });
    expect(formatClockTime(8, 5)).toBe('08:05');
  });

  it('el desuso usa la hora del diario salvo que tenga una propia', () => {
    const s = { ...DEFAULT_REMINDER_SETTINGS, dailyTime: '20:30' };
    expect(effectiveIdleTime(s)).toBe('20:30');
    expect(effectiveIdleTime({ ...s, idleTime: '08:00' })).toBe('08:00');
  });

  it('cuenta los avisos encendidos', () => {
    expect(activeReminderCount({ ...DEFAULT_REMINDER_SETTINGS, dailyOn: true, idleOn: true })).toBe(
      2,
    );
  });

  it.each([0, 15, 2.5])('rechaza %s días de desuso', (idleDays) => {
    const r = validateReminderSettings({ ...DEFAULT_REMINDER_SETTINGS, idleDays });
    expect(r).toEqual({ ok: false, errors: { idleDays: 'outOfRange' } });
  });

  it('rechaza horas inválidas', () => {
    const r = validateReminderSettings({
      ...DEFAULT_REMINDER_SETTINGS,
      dailyTime: '25:00',
      idleTime: 'x',
    });
    expect(r).toEqual({ ok: false, errors: { dailyTime: 'invalid', idleTime: 'invalid' } });
  });

  it('acepta los valores por omisión y los límites', () => {
    expect(validateReminderSettings(DEFAULT_REMINDER_SETTINGS).ok).toBe(true);
    expect(validateReminderSettings({ ...DEFAULT_REMINDER_SETTINGS, idleDays: 14 }).ok).toBe(true);
  });
});
