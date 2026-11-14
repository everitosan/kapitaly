import { SHORTCUT_ICON, WALLET_BOUNDS } from '../shortcutIconArt';

const { center, safeRadius } = SHORTCUT_ICON;
const distance = (x: number, y: number) => Math.hypot(x - center, y - center);

describe('ícono del acceso directo', () => {
  it('los círculos caben en la zona segura y van del mayor al menor', () => {
    const radii = [...SHORTCUT_ICON.circleRadii];
    expect(Math.max(...radii)).toBeLessThanOrEqual(safeRadius);
    expect(radii).toEqual([...radii].sort((a, b) => b - a));
  });

  it('la cartera queda completa dentro de la zona segura y centrada', () => {
    const { minX, maxX, minY, maxY } = WALLET_BOUNDS;
    for (const [x, y] of [
      [minX, minY],
      [maxX, minY],
      [minX, maxY],
      [maxX, maxY],
    ])
      expect(distance(x, y)).toBeLessThan(safeRadius);
    expect(Math.abs((minX + maxX) / 2 - center)).toBeLessThan(2);
    expect(Math.abs((minY + maxY) / 2 - center)).toBeLessThan(2);
  });

  it('el área visible es la de un ícono adaptativo (72 de 108)', () => {
    expect(SHORTCUT_ICON.canvas).toBe(108);
    expect(SHORTCUT_ICON.visible).toBe(72);
  });
});
