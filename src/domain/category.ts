import { isDeleted, type SyncMeta, type Validation } from './common';

/** Claves del set de íconos de categoría. Se guardan en la base; la UI dibuja cada una. */
export const CATEGORY_ICON_KEYS = [
  'home',
  'food',
  'car',
  'bolt',
  'repeat',
  'health',
  'ticket',
  'dots',
  'dumbbell',
  'bag',
  'cart',
  'gift',
  'book',
  'school',
  'plane',
  'bus',
  'fuel',
  'wrench',
  'phone',
  'tv',
  'music',
  'coffee',
  'pill',
  'paw',
  'shirt',
  'briefcase',
] as const;

export type CategoryIconKey = (typeof CATEGORY_ICON_KEYS)[number];

export const isCategoryIconKey = (key: string): key is CategoryIconKey =>
  (CATEGORY_ICON_KEYS as readonly string[]).includes(key);

export interface Category extends SyncMeta {
  name: string;
  icon: CategoryIconKey;
  /** De inicio (sembrada por la migración, mismo id en toda la suite). */
  builtin: boolean;
  /** Solo de inicio: oculta para gastos nuevos; `null` si se ofrece. */
  hiddenAt: string | null;
}

export interface CategoryInput {
  name: string;
  icon: CategoryIconKey;
}

/** Id fijo de "Otro": igual en todas las instalaciones y apps de la suite. */
export const OTHER_CATEGORY_ID = '00000000-0000-4000-8000-000000000108';

/** Categorías de inicio, en el orden en que se muestran. Sus ids no cambian nunca. */
export const BUILTIN_CATEGORIES: readonly (CategoryInput & { id: string })[] = [
  { id: '00000000-0000-4000-8000-000000000101', name: 'Hogar', icon: 'home' },
  { id: '00000000-0000-4000-8000-000000000102', name: 'Comida', icon: 'food' },
  { id: '00000000-0000-4000-8000-000000000103', name: 'Transporte', icon: 'car' },
  { id: '00000000-0000-4000-8000-000000000104', name: 'Servicios', icon: 'bolt' },
  { id: '00000000-0000-4000-8000-000000000105', name: 'Suscripciones', icon: 'repeat' },
  { id: '00000000-0000-4000-8000-000000000106', name: 'Salud', icon: 'health' },
  { id: '00000000-0000-4000-8000-000000000107', name: 'Entretenimiento', icon: 'ticket' },
  { id: OTHER_CATEGORY_ID, name: 'Otro', icon: 'dots' },
];

/** Lo que la UI necesita para mostrar la categoría de un gasto. */
export type CategoryView = Pick<Category, 'id' | 'name' | 'icon'>;

const OTHER_VIEW: CategoryView = { id: OTHER_CATEGORY_ID, name: 'Otro', icon: 'dots' };

/** Nombre comparable: sin acentos, sin mayúsculas y con espacios normalizados. */
export const normalizeCategoryName = (name: string): string =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');

/**
 * Categoría de un gasto: la vigente con ese id (aunque esté oculta) o "Otro" si no existe o se
 * borró. Así un gasto nunca queda sin categoría.
 */
export function resolveCategory(categoryId: string, categories: readonly Category[]): CategoryView {
  const found = categories.find((c) => c.id === categoryId && !isDeleted(c));
  if (found) return found;
  return categories.find((c) => c.id === OTHER_CATEGORY_ID && !isDeleted(c)) ?? OTHER_VIEW;
}

/** Se ofrece para gastos nuevos: vigente y no oculta. */
export const isSelectableCategory = (c: Category): boolean => !isDeleted(c) && c.hiddenAt === null;

const isOther = (c: Pick<Category, 'id'>) => c.id === OTHER_CATEGORY_ID;

/** Solo las personalizadas se renombran. */
export const canRename = (c: Pick<Category, 'builtin'>): boolean => !c.builtin;
/** Todas salvo "Otro" pueden cambiar de ícono. */
export const canChangeIcon = (c: Pick<Category, 'id'>): boolean => !isOther(c);
/** Solo las de inicio distintas de "Otro" se ocultan. */
export const canHide = (c: Pick<Category, 'id' | 'builtin'>): boolean => c.builtin && !isOther(c);
/** Solo las personalizadas se borran (sus gastos pasan a mostrarse como "Otro"). */
export const canRemove = (c: Pick<Category, 'builtin'>): boolean => !c.builtin;

/** Lo mínimo de un gasto que necesitan las reglas de categorías. */
export interface CategoryRef {
  categoryId: string;
  deletedAt: string | null;
}

/** Cuántos gastos vigentes (recurrentes y únicos) tienen la categoría. */
export const countCategoryUses = (categoryId: string, expenses: readonly CategoryRef[]): number =>
  expenses.filter((e) => e.categoryId === categoryId && !isDeleted(e)).length;

export type CategoryField = 'name' | 'icon';

export interface CategoryDraft {
  name: string;
  icon: string;
}

/**
 * Valida una categoría nueva o editada. `current` es la categoría que se edita (o `null` al
 * crear): una de inicio conserva su nombre y "Otro" también su ícono. El nombre no puede
 * repetir el de otra categoría no eliminada, incluidas las ocultas.
 */
export function validateCategoryInput(
  draft: CategoryDraft,
  categories: readonly Category[],
  current: Category | null = null,
): Validation<CategoryInput, CategoryField> {
  const errors: Partial<Record<CategoryField, string>> = {};

  const name = draft.name.trim().replace(/\s+/g, ' ');
  if (name === '') errors.name = 'required';
  else if (current && !canRename(current) && name !== current.name) errors.name = 'locked';
  else if (
    categories.some(
      (c) =>
        !isDeleted(c) &&
        c.id !== current?.id &&
        normalizeCategoryName(c.name) === normalizeCategoryName(name),
    )
  )
    errors.name = 'duplicate';

  if (!isCategoryIconKey(draft.icon)) errors.icon = 'invalid';
  else if (current && !canChangeIcon(current) && draft.icon !== current.icon)
    errors.icon = 'locked';

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { name, icon: draft.icon as CategoryIconKey } };
}
