import { useEffect, useState } from 'react';

import { DAILY_INCLUDE_RECURRING_KEY, parseIncludeRecurring } from '@/domain/uiPreferences';

import { useRepositories } from '../repositories';

/**
 * Switch "Incluir domiciliados" del gasto por día, guardado en el teléfono.
 * `loaded` es falso hasta leerlo, para no dibujar la tarjeta de una forma y luego de otra.
 */
export function useDailyIncludeRecurring(): {
  includeRecurring: boolean;
  loaded: boolean;
  toggle: () => void;
} {
  const repo = useRepositories().uiPreferences;
  const [state, setState] = useState({ includeRecurring: false, loaded: false });

  useEffect(() => {
    let active = true;
    repo.get(DAILY_INCLUDE_RECURRING_KEY).then((value) => {
      if (active) setState({ includeRecurring: parseIncludeRecurring(value), loaded: true });
    });
    return () => {
      active = false;
    };
  }, [repo]);

  const toggle = () => {
    const next = !state.includeRecurring;
    setState({ includeRecurring: next, loaded: true });
    repo.set(DAILY_INCLUDE_RECURRING_KEY, next ? '1' : '0');
  };

  return { ...state, toggle };
}
