import { SHORTCUT_ICON, WALLET_SOURCE_BOUNDS } from '../shortcutIconArt';

const { center, safeRadius, visible, canvas, field, wallet } = SHORTCUT_ICON;
const distance = (x: number, y: number) => Math.hypot(x - center, y - center);
const toCanvas = (x: number, y: number) => [
  wallet.transform.translateX + wallet.transform.scale * x,
  wallet.transform.translateY + wallet.transform.scale * y,
];
const edge = (canvas - visible) / 2; // 18: borde del área visible
const inField = (x: number, y: number) => Math.hypot(x - field.cx, y - field.cy) <= field.r;

describe('ícono del acceso directo', () => {
  it('la cartera queda completa dentro de la zona segura y centrada', () => {
    const { minX, maxX, minY, maxY } = WALLET_SOURCE_BOUNDS;
    const corners = [
      toCanvas(minX, minY),
      toCanvas(maxX, minY),
      toCanvas(minX, maxY),
      toCanvas(maxX, maxY),
    ];
    for (const [x, y] of corners) expect(distance(x, y)).toBeLessThan(safeRadius);
    const [x0, y0] = corners[0];
    const [x1, y1] = corners[3];
    expect(Math.abs((x0 + x1) / 2 - center)).toBeLessThan(1);
    expect(Math.abs((y0 + y1) / 2 - center)).toBeLessThan(1);
  });

  it('el campo verde deja la esquina oscura arriba a la izquierda, también con máscara redonda', () => {
    // Punto de la máscara redonda (radio 36) más cercano a la esquina superior izquierda.
    const r = visible / 2;
    const corner = center - r / Math.SQRT2;
    expect(inField(corner, corner)).toBe(false);
  });

  it('el campo verde cubre los demás bordes del área visible, sin franjas oscuras', () => {
    const far = canvas - edge; // 90
    // Cruza los bordes superior e izquierdo dentro del área visible: la esquina es una cuña, no una
    // franja a lo largo del borde.
    const crossing = field.cx - Math.sqrt(field.r ** 2 - (edge - field.cy) ** 2);
    expect(crossing).toBeGreaterThan(edge);
    expect(crossing).toBeLessThan(far);
    // Cubre las otras tres esquinas del área visible.
    expect(inField(far, edge)).toBe(true);
    expect(inField(edge, far)).toBe(true);
    expect(inField(far, far)).toBe(true);
  });

  it('el área visible es la de un ícono adaptativo (72 de 108)', () => {
    expect(canvas).toBe(108);
    expect(visible).toBe(72);
  });
});
