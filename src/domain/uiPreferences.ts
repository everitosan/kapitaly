import type { SortDirection } from './balance';

/*
 * Preferencias de interfaz que se conservan entre aperturas de la app (clave-valor en el teléfono).
 * Los valores se validan al leer: uno ausente o inválido usa el valor por omisión.
 */

/** Orden de la lista de "Tus gastos". */
export const BALANCE_SORT_KEY = 'balance.sort';
export const DEFAULT_BALANCE_SORT: SortDirection = 'asc';

export function parseBalanceSort(value: string | null): SortDirection {
  return value === 'asc' || value === 'desc' ? value : DEFAULT_BALANCE_SORT;
}
