/** Normaliza para buscar: sin acentos, en minúsculas y sin espacios en los extremos. */
export const normalizeSearch = (text: string): string =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Si algún campo contiene el texto buscado, sin distinguir mayúsculas ni acentos. Vacío coincide. */
export function matchesSearch(
  query: string,
  fields: readonly (string | null | undefined)[],
): boolean {
  const q = normalizeSearch(query);
  if (q === '') return true;
  return fields.some((f) => f != null && normalizeSearch(f).includes(q));
}
