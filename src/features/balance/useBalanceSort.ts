import { useEffect, useState } from 'react';

import type { SortDirection } from '@/domain/balance';
import { BALANCE_SORT_KEY, DEFAULT_BALANCE_SORT, parseBalanceSort } from '@/domain/uiPreferences';

import { useRepositories } from '../repositories';

/**
 * Orden de la lista de "Este mes", guardado en el teléfono para que se conserve entre aperturas.
 * `loaded` es falso hasta leerlo, para no dibujar la lista en un orden y luego en el otro.
 */
export function useBalanceSort(): {
  sort: SortDirection;
  loaded: boolean;
  toggle: () => void;
} {
  const repo = useRepositories().uiPreferences;
  const [state, setState] = useState<{ sort: SortDirection; loaded: boolean }>({
    sort: DEFAULT_BALANCE_SORT,
    loaded: false,
  });

  useEffect(() => {
    let active = true;
    repo.get(BALANCE_SORT_KEY).then((value) => {
      if (active) setState({ sort: parseBalanceSort(value), loaded: true });
    });
    return () => {
      active = false;
    };
  }, [repo]);

  const toggle = () => {
    const next: SortDirection = state.sort === 'asc' ? 'desc' : 'asc';
    setState({ sort: next, loaded: true });
    repo.set(BALANCE_SORT_KEY, next);
  };

  return { ...state, toggle };
}
