import { isQuickLaunch, shouldAnimateSplash } from '../splashRules';

describe('isQuickLaunch', () => {
  it.each([
    ['kapitalyexpenses://expense/new?quick=1', true],
    ['kapitalyexpenses://expense/new?foo=2&quick=1', true],
    ['kapitalyexpenses://expense/new', false],
    ['kapitalyexpenses://expense/new?quick=10', false],
    ['kapitalyexpenses://', false],
    [null, false],
  ])('%s -> %s', (url, expected) => {
    expect(isQuickLaunch(url)).toBe(expected);
  });
});

describe('shouldAnimateSplash', () => {
  it('anima en un arranque normal', () => {
    expect(shouldAnimateSplash(null, false)).toBe(true);
  });

  it('no anima desde el atajo "Nuevo gasto"', () => {
    expect(shouldAnimateSplash('kapitalyexpenses://expense/new?quick=1', false)).toBe(false);
  });

  it('no anima con reducir movimiento activado', () => {
    expect(shouldAnimateSplash(null, true)).toBe(false);
  });
});
