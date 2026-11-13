import { BUILTIN_CATEGORIES, OTHER_CATEGORY_ID, type Category } from '@/domain/category';

import type { Theme } from './theme';

/**
 * Color estable de una categoría en las gráficas: por su posición entre las categorías (las de
 * inicio en su orden y luego las personalizadas por fecha de alta), así conserva su color de un mes a
 * otro. "Otro" siempre usa el gris neutro; con más categorías que tonos, los colores se repiten.
 */
export function categoryColorMap(
  categories: readonly Category[],
  theme: Pick<Theme, 'chart'>,
): (categoryId: string) => string {
  const builtinOrder = new Map(BUILTIN_CATEGORIES.map((c, i) => [c.id, i]));
  const ordered = categories
    .filter((c) => c.id !== OTHER_CATEGORY_ID)
    .sort((a, b) => {
      const ia = builtinOrder.get(a.id);
      const ib = builtinOrder.get(b.id);
      if (ia !== undefined && ib !== undefined) return ia - ib;
      if (ia !== undefined) return -1;
      if (ib !== undefined) return 1;
      return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
    });
  const index = new Map(ordered.map((c, i) => [c.id, i]));
  const { series, other } = theme.chart;
  return (id) => {
    const i = index.get(id);
    return i === undefined ? other : series[i % series.length];
  };
}
