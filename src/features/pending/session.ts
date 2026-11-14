import { useSyncExternalStore } from 'react';

/**
 * Estado de la sesión (en memoria, se pierde al cerrar la app): los pendientes que el usuario pospuso
 * con "Aún no" y si ya cerró la hoja automática. Así la pregunta vuelve en la siguiente apertura.
 *
 * Es un store suscribible: cada cambio crea un snapshot nuevo, para que React (y el React Compiler,
 * que memoiza por identidad) vuelva a calcular lo que depende de él. No leer estado mutable de módulo
 * durante el render: el compilador no lo ve cambiar.
 */
export interface PendingSessionSnapshot {
  snoozed: ReadonlySet<string>;
  autoDismissed: boolean;
}

const INITIAL: PendingSessionSnapshot = { snoozed: new Set(), autoDismissed: false };
let snapshot = INITIAL;
const listeners = new Set<() => void>();

function update(next: PendingSessionSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => snapshot;

export const pendingSession = {
  subscribe,
  getSnapshot,
  isSnoozed: (key: string) => snapshot.snoozed.has(key),
  snooze: (key: string) => {
    if (snapshot.snoozed.has(key)) return;
    update({ ...snapshot, snoozed: new Set(snapshot.snoozed).add(key) });
  },
  get autoDismissed() {
    return snapshot.autoDismissed;
  },
  dismissAuto: () => {
    if (!snapshot.autoDismissed) update({ ...snapshot, autoDismissed: true });
  },
  /** Solo para pruebas: simula una nueva apertura de la app. */
  reset: () => update(INITIAL),
};

/** Lo pospuesto y si ya se cerró la hoja automática, como valor que React puede seguir. */
export function usePendingSession(): PendingSessionSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const chargeKey = (expenseId: string, date: string) => `c|${expenseId}|${date}`;
export const paymentKey = (methodId: string, dueDate: string) => `p|${methodId}|${dueDate}`;
