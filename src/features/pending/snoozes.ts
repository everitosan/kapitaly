import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import {
  msUntilNextExpiry,
  SHEET_SNOOZE_KEY,
  SNOOZE_HOURS,
  type PendingSnooze,
} from '@/domain/pendingSnooze';

import { useRepositories } from '../repositories';

/** Máximo que se espera para recalcular: nunca más que un plazo completo. */
const MAX_WAIT_MS = SNOOZE_HOURS * 60 * 60 * 1000 + 60 * 1000;

/** Las filas vencidas se borran una vez por apertura de la app. */
let purged = false;

export interface PendingSnoozes {
  loaded: boolean;
  /** Claves de pendientes pospuestos vigentes. */
  snoozed: ReadonlySet<string>;
  /** Si "Cerrar" la hoja sigue vigente: no debe abrirse sola. */
  sheetDismissed: boolean;
}

/**
 * Lo pospuesto vigente, leído de SQLite. Se recarga cuando cambia, al volver a primer plano y al
 * vencer el siguiente plazo, para que un pendiente vuelva a contar aunque la app siga abierta.
 */
export function usePendingSnoozes(): PendingSnoozes {
  const repo = useRepositories().pendingSnoozes;
  const [items, setItems] = useState<PendingSnooze[] | null>(null);

  useEffect(() => {
    let active = true;
    let version = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = () => {
      const current = ++version;
      repo.list().then((list) => {
        if (!active || current !== version) return;
        setItems(list);
        clearTimeout(timer);
        const ms = msUntilNextExpiry(list, new Date().toISOString());
        if (ms !== null && ms <= MAX_WAIT_MS) timer = setTimeout(load, ms + 50);
      });
    };
    if (purged) load();
    else {
      purged = true;
      repo.purgeExpired().then(load);
    }
    const unsubscribe = repo.subscribe(load);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') load();
    });
    return () => {
      active = false;
      clearTimeout(timer);
      unsubscribe();
      sub.remove();
    };
  }, [repo]);

  const keys = new Set((items ?? []).map((s) => s.key));
  return {
    loaded: items !== null,
    snoozed: keys,
    sheetDismissed: keys.has(SHEET_SNOOZE_KEY),
  };
}
