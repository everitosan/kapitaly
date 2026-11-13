import { matchesSearch, normalizeSearch } from '../search';

describe('búsqueda', () => {
  it('normaliza acentos, mayúsculas y espacios', () => {
    expect(normalizeSearch('  Súper ÁRBOL ')).toBe('super arbol');
  });

  it('filtrar por nombre', () => {
    expect(matchesSearch('netf', ['Netflix', 'Suscripciones', 'BBVA Azul'])).toBe(true);
    expect(matchesSearch('netf', ['Renta', 'Hogar', 'Nu Débito'])).toBe(false);
  });

  it('filtrar por categoría sin acentos ni mayúsculas', () => {
    expect(matchesSearch('HOGAR', ['Renta', 'Hogar', 'Nu Débito'])).toBe(true);
    expect(matchesSearch('debito', ['Renta', 'Hogar', 'Nu Débito'])).toBe(true);
  });

  it('texto vacío coincide con todo e ignora campos nulos', () => {
    expect(matchesSearch('   ', ['Renta'])).toBe(true);
    expect(matchesSearch('x', [null, undefined])).toBe(false);
  });
});
