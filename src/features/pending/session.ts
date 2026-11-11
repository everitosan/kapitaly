/**
 * Estado de la sesión (en memoria, se pierde al cerrar la app): los pendientes que el usuario pospuso
 * con "Aún no" y si ya cerró la hoja automática. Así la pregunta vuelve en la siguiente apertura.
 */
const snoozed = new Set<string>();
let autoDismissed = false;

export const pendingSession = {
  isSnoozed: (key: string) => snoozed.has(key),
  snooze: (key: string) => {
    snoozed.add(key);
  },
  get autoDismissed() {
    return autoDismissed;
  },
  dismissAuto: () => {
    autoDismissed = true;
  },
  /** Solo para pruebas: simula una nueva apertura de la app. */
  reset: () => {
    snoozed.clear();
    autoDismissed = false;
  },
};

export const chargeKey = (expenseId: string, date: string) => `c|${expenseId}|${date}`;
export const paymentKey = (methodId: string, dueDate: string) => `p|${methodId}|${dueDate}`;
