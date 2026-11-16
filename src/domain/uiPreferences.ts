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

/** Switch "Incluir domiciliados" de "Gasto del día a día": apagado por omisión. */
export const DAILY_INCLUDE_RECURRING_KEY = 'daily.includeRecurring';

export function parseIncludeRecurring(value: string | null): boolean {
  return value === '1';
}
