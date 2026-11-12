import {
  BUILTIN_CATEGORIES,
  canChangeIcon,
  canHide,
  canRemove,
  canRename,
  CATEGORY_ICON_KEYS,
  countCategoryUses,
  isSelectableCategory,
  normalizeCategoryName,
  OTHER_CATEGORY_ID,
  resolveCategory,
  validateCategoryInput,
  type Category,
} from '../category';

const META = { createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };
const builtins: Category[] = BUILTIN_CATEGORIES.map((b) => ({
  ...b,
  ...META,
  builtin: true,
  hiddenAt: null,
  deletedAt: null,
}));
const byName = (name: string) => builtins.find((c) => c.name === name)!;
const gym: Category = {
  id: 'gym',
  name: 'Gimnasio',
  icon: 'dumbbell',
  builtin: false,
  hiddenAt: null,
  deletedAt: null,
  ...META,
};
const all = [...builtins, gym];

describe('categorías de inicio', () => {
  it('son 8, con "Otro" al final y ids fijos únicos', () => {
    expect(BUILTIN_CATEGORIES.map((c) => c.name)).toEqual([
      'Hogar',
      'Comida',
      'Transporte',
      'Servicios',
      'Suscripciones',
      'Salud',
      'Entretenimiento',
      'Otro',
    ]);
    expect(BUILTIN_CATEGORIES.at(-1)!.id).toBe(OTHER_CATEGORY_ID);
    expect(new Set(BUILTIN_CATEGORIES.map((c) => c.id)).size).toBe(8);
  });

  it('cada una usa un ícono del set', () => {
    for (const c of BUILTIN_CATEGORIES) expect(CATEGORY_ICON_KEYS).toContain(c.icon);
  });
});

describe('reglas de edición', () => {
  it('"Otro" es fija', () => {
    const otro = byName('Otro');
    expect([canRename(otro), canHide(otro), canRemove(otro), canChangeIcon(otro)]).toEqual([
      false,
      false,
      false,
      false,
    ]);
  });

  it('las de inicio se ocultan y cambian de ícono, pero no se renombran ni borran', () => {
    const comida = byName('Comida');
    expect([canRename(comida), canHide(comida), canRemove(comida), canChangeIcon(comida)]).toEqual([
      false,
      true,
      false,
      true,
    ]);
  });

  it('las personalizadas se renombran, cambian de ícono y se borran, pero no se ocultan', () => {
    expect([canRename(gym), canHide(gym), canRemove(gym), canChangeIcon(gym)]).toEqual([
      true,
      false,
      true,
      true,
    ]);
  });
});

describe('validateCategoryInput', () => {
  it('crea "Gimnasio" limpiando espacios', () => {
    expect(validateCategoryInput({ name: '  Club   deportivo ', icon: 'dumbbell' }, all)).toEqual({
      ok: true,
      value: { name: 'Club deportivo', icon: 'dumbbell' },
    });
  });

  it('nombre vacío', () => {
    const r = validateCategoryInput({ name: '  ', icon: 'dots' }, all);
    expect(!r.ok && r.errors.name).toBe('required');
  });

  it('nombre repetido sin distinguir mayúsculas ni acentos, incluidas las ocultas', () => {
    const hidden = all.map((c) => (c.name === 'Salud' ? { ...c, hiddenAt: META.createdAt } : c));
    for (const name of ['comida', 'GIMNASIO', 'salúd']) {
      const r = validateCategoryInput({ name, icon: 'dots' }, hidden);
      expect(!r.ok && r.errors.name).toBe('duplicate');
    }
  });

  it('un nombre de una categoría borrada se puede reutilizar', () => {
    const deleted = all.map((c) => (c.id === 'gym' ? { ...c, deletedAt: META.createdAt } : c));
    expect(validateCategoryInput({ name: 'Gimnasio', icon: 'dumbbell' }, deleted).ok).toBe(true);
  });

  it('al editar, su propio nombre no cuenta como repetido', () => {
    expect(validateCategoryInput({ name: 'gimnasio', icon: 'bag' }, all, gym).ok).toBe(true);
  });

  it('ícono fuera del set', () => {
    const r = validateCategoryInput({ name: 'Viajes', icon: '✈️' }, all);
    expect(!r.ok && r.errors.icon).toBe('invalid');
  });

  it('una de inicio no se renombra pero sí cambia de ícono', () => {
    const comida = byName('Comida');
    const renamed = validateCategoryInput({ name: 'Restaurantes', icon: 'food' }, all, comida);
    expect(!renamed.ok && renamed.errors.name).toBe('locked');
    expect(validateCategoryInput({ name: 'Comida', icon: 'coffee' }, all, comida).ok).toBe(true);
  });

  it('"Otro" no cambia de ícono', () => {
    const r = validateCategoryInput({ name: 'Otro', icon: 'bag' }, all, byName('Otro'));
    expect(!r.ok && r.errors.icon).toBe('locked');
  });
});

describe('resolveCategory', () => {
  it('devuelve la categoría vigente, aunque esté oculta', () => {
    const hidden = all.map((c) => (c.name === 'Salud' ? { ...c, hiddenAt: META.createdAt } : c));
    expect(resolveCategory(byName('Salud').id, hidden).name).toBe('Salud');
  });

  it('una categoría borrada o desconocida se muestra como "Otro"', () => {
    const deleted = all.map((c) => (c.id === 'gym' ? { ...c, deletedAt: META.createdAt } : c));
    expect(resolveCategory('gym', deleted)).toMatchObject({ id: OTHER_CATEGORY_ID, name: 'Otro' });
    expect(resolveCategory('nope', [])).toMatchObject({ id: OTHER_CATEGORY_ID, icon: 'dots' });
  });
});

it('solo se ofrecen las vigentes y no ocultas', () => {
  expect(isSelectableCategory(gym)).toBe(true);
  expect(isSelectableCategory({ ...gym, hiddenAt: META.createdAt })).toBe(false);
  expect(isSelectableCategory({ ...gym, deletedAt: META.createdAt })).toBe(false);
});

it('cuenta los gastos vigentes de una categoría', () => {
  expect(
    countCategoryUses('gym', [
      { categoryId: 'gym', deletedAt: null },
      { categoryId: 'gym', deletedAt: META.createdAt },
      { categoryId: OTHER_CATEGORY_ID, deletedAt: null },
    ]),
  ).toBe(1);
});

it('normaliza nombres para compararlos', () => {
  expect(normalizeCategoryName('  Salúd   Mental ')).toBe('salud mental');
});
