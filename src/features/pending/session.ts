import { useSyncExternalStore } from 'react';

/**
 * Estado de esta apertura de la app (en memoria): si la hoja de Pendientes ya se abrió sola. Lo
 * pospuesto ("Posponer" y "Cerrar") vive en SQLite con su plazo de 6 horas (ver snoozes.ts).
 *
 * Es un store suscribible: cada cambio crea un snapshot nuevo, para que React (y el React Compiler,
 * que memoiza por identidad) vuelva a calcular lo que depende de él. No leer estado mutable de módulo
 * durante el render: el compilador no lo ve cambiar.
 */
export interface PendingSessionSnapshot {
  autoDismissed: boolean;
}

const INITIAL: PendingSessionSnapshot = { autoDismissed: false };
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
  get autoDismissed() {
    return snapshot.autoDismissed;
  },
  dismissAuto: () => {
    if (!snapshot.autoDismissed) update({ autoDismissed: true });
  },
  /** Solo para pruebas: simula una nueva apertura de la app. */
  reset: () => update(INITIAL),
};

/** Si la hoja ya se abrió sola en esta apertura, como valor que React puede seguir. */
export function usePendingSession(): PendingSessionSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const chargeKey = (expenseId: string, date: string) => `c|${expenseId}|${date}`;
export const paymentKey = (methodId: string, dueDate: string) => `p|${methodId}|${dueDate}`;
