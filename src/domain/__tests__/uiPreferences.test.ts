import {
  BALANCE_SORT_KEY,
  DAILY_INCLUDE_RECURRING_KEY,
  DEFAULT_BALANCE_SORT,
  parseBalanceSort,
  parseIncludeRecurring,
} from '../uiPreferences';

describe('preferencias de interfaz', () => {
  it('el orden de Tus gastos empieza en "Más antiguo"', () => {
    expect(BALANCE_SORT_KEY).toBe('balance.sort');
    expect(DEFAULT_BALANCE_SORT).toBe('asc');
  });

  it.each([
    ['asc', 'asc'],
    ['desc', 'desc'],
    [null, 'asc'],
    ['', 'asc'],
    ['DESC', 'asc'],
  ])('lee %p como %p', (value, expected) => {
    expect(parseBalanceSort(value)).toBe(expected);
  });

  it.each([
    ['1', true],
    ['0', false],
    [null, false],
    ['true', false],
  ])('"Incluir domiciliados" lee %p como %p', (value, expected) => {
    expect(DAILY_INCLUDE_RECURRING_KEY).toBe('daily.includeRecurring');
    expect(parseIncludeRecurring(value)).toBe(expected);
  });
});
