import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { CategoryIconKey } from '@/domain/category';

/** Primitivas de un ícono de 24×24 con trazo redondeado. */
type Shape =
  | { d: string }
  | { cx: number; cy: number; r: number }
  | { x: number; y: number; width: number; height: number; rx: number };

const p = (d: string): Shape => ({ d });
const c = (cx: number, cy: number, r: number): Shape => ({ cx, cy, r });
const r = (x: number, y: number, width: number, height: number, rx: number): Shape => ({
  x,
  y,
  width,
  height,
  rx,
});

/**
 * Set de íconos de categoría (ver `LICENSE-lucide`). Son SVG propios para que se vean igual en
 * Android, iOS y web; en la base solo se guarda la clave.
 */
export const CATEGORY_ICONS: Record<CategoryIconKey, readonly Shape[]> = {
  home: [p('M3 10.5 12 3l9 7.5'), p('M5 9.5V21h14V9.5'), p('M10 21v-6h4v6')],
  food: [
    p('M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2'),
    p('M7 2v20'),
    p('M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7'),
  ],
  car: [
    p(
      'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2',
    ),
    c(7, 17, 2),
    p('M9 17h6'),
    c(17, 17, 2),
  ],
  bolt: [p('M13 2 3 14h9l-1 8 10-12h-9l1-8z')],
  repeat: [
    p('m17 2 4 4-4 4'),
    p('M3 11v-1a4 4 0 0 1 4-4h14'),
    p('m7 22-4-4 4-4'),
    p('M21 13v1a4 4 0 0 1-4 4H3'),
  ],
  health: [
    p(
      'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
    ),
    p('M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27'),
  ],
  ticket: [
    p(
      'M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z',
    ),
    p('M13 5v2'),
    p('M13 17v2'),
    p('M13 11v2'),
  ],
  dots: [c(12, 12, 1), c(19, 12, 1), c(5, 12, 1)],
  dumbbell: [p('M6 7v10'), p('M18 7v10'), p('M3 9.5v5'), p('M21 9.5v5'), p('M6 12h12')],
  bag: [
    p('M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z'),
    p('M3 6h18'),
    p('M16 10a4 4 0 0 1-8 0'),
  ],
  cart: [
    c(8, 21, 1),
    c(19, 21, 1),
    p('M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12'),
  ],
  gift: [
    r(3, 8, 18, 4, 1),
    p('M12 8v13'),
    p('M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7'),
    p('M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5'),
  ],
  book: [p('M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20')],
  school: [p('M22 10 12 5 2 10l10 5 10-5Z'), p('M6 12v5c3 3 9 3 12 0v-5')],
  plane: [
    p(
      'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z',
    ),
  ],
  bus: [r(4, 3, 16, 16, 2), p('M4 11h16'), p('M8 19v2'), p('M16 19v2'), c(8, 15, 1), c(16, 15, 1)],
  fuel: [
    p('M3 22h12'),
    p('M4 9h10'),
    p('M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18'),
    p('M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0V9.83a2 2 0 0 0-.59-1.42L18 5'),
  ],
  wrench: [
    p(
      'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
    ),
  ],
  phone: [r(5, 2, 14, 20, 2), p('M12 18h.01')],
  tv: [r(2, 7, 20, 15, 2), p('m17 2-5 5-5-5')],
  music: [p('M9 18V5l12-2v13'), c(6, 18, 3), c(18, 16, 3)],
  coffee: [
    p('M17 8h1a4 4 0 1 1 0 8h-1'),
    p('M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z'),
    p('M6 2v2'),
    p('M10 2v2'),
    p('M14 2v2'),
  ],
  pill: [p('m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z'), p('m8.5 8.5 7 7')],
  paw: [
    c(11, 4, 2),
    c(18, 8, 2),
    c(20, 16, 2),
    p(
      'M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.05Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z',
    ),
  ],
  shirt: [
    p(
      'M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z',
    ),
  ],
  briefcase: [r(2, 7, 20, 14, 2), p('M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16')],
};

/** Dibuja el ícono de una categoría; una clave desconocida usa el de "Otro". */
export function CategoryIcon({
  icon,
  color,
  size = 20,
  testID,
}: {
  icon: string;
  color: string;
  size?: number;
  testID?: string;
}) {
  const shapes = CATEGORY_ICONS[icon as CategoryIconKey] ?? CATEGORY_ICONS.dots;
  const stroke = {
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <Svg testID={testID} width={size} height={size} viewBox="0 0 24 24" fill="none">
      {shapes.map((s, i) =>
        'd' in s ? (
          <Path key={i} d={s.d} {...stroke} />
        ) : 'r' in s ? (
          <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} {...stroke} />
        ) : (
          <Rect key={i} x={s.x} y={s.y} width={s.width} height={s.height} rx={s.rx} {...stroke} />
        ),
      )}
    </Svg>
  );
}
