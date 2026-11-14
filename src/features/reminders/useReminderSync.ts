import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { civilDateFromLocal } from '@/domain/date';
import { formatClockTime } from '@/domain/reminderSettings';
import { planReminders, type ScheduledReminder } from '@/domain/reminders';

import { registeredOnLocal } from '../pending/usePending';
import {
  useCardPayments,
  useChargeConfirmations,
  useOneOffExpenses,
  usePaymentMethods,
  useRecurringExpenses,
  useReminderSettings,
} from '../repositories';
import * as defaultScheduler from './scheduler';

/** Espera antes de sincronizar, para agrupar varios cambios seguidos en una sola vez. */
export const SYNC_DELAY_MS = 500;

export interface ReminderSyncOptions {
  scheduler?: Pick<typeof defaultScheduler, 'permissionStatus' | 'sync'>;
  now?: () => Date;
  delayMs?: number;
}

/** Las sincronizaciones se encadenan: nunca corren dos a la vez. */
let queue: Promise<void> = Promise.resolve();

/**
 * Mantiene las notificaciones agendadas al día con las preferencias y los datos: recalcula el plan
 * cuando cambian, al abrir la app y al volver a primer plano. Sin permiso no agenda nada.
 */
export function useReminderSync({
  scheduler = defaultScheduler,
  now = () => new Date(),
  delayMs = SYNC_DELAY_MS,
}: ReminderSyncOptions = {}): void {
  const settings = useReminderSettings();
  const recurring = useRecurringExpenses();
  const oneOffs = useOneOffExpenses();
  const confirmations = useChargeConfirmations();
  const payments = useCardPayments();
  const methods = usePaymentMethods();
  // Volver a primer plano mueve "hoy" (y la hora): se recalcula el plan.
  const [foreground, setForeground] = useState(0);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setForeground((n) => n + 1);
    });
    return () => sub.remove();
  }, []);

  const loaded =
    settings.data !== null &&
    [recurring, oneOffs, confirmations, payments, methods].every((l) => !l.loading);

  useEffect(() => {
    if (!loaded || settings.data === null) return;
    const prefs = settings.data;
    const handle = setTimeout(() => {
      queue = queue
        .then(async () => {
          const date = now();
          const plan: ScheduledReminder[] =
            (await scheduler.permissionStatus()) === 'granted'
              ? planReminders(
                  prefs,
                  {
                    recurring: recurring.data,
                    oneOffs: oneOffs.data,
                    confirmations: confirmations.data,
                    payments: payments.data,
                    methods: methods.data,
                  },
                  {
                    today: civilDateFromLocal(date),
                    time: formatClockTime(date.getHours(), date.getMinutes()),
                  },
                  registeredOnLocal,
                )
              : [];
          await scheduler.sync(plan);
        })
        .catch(() => {
          // Un fallo del sistema al agendar no debe romper la app; se reintenta en el próximo cambio.
        });
    }, delayMs);
    return () => clearTimeout(handle);
    // `now`, `scheduler` y `delayMs` son configuración fija.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loaded,
    settings.data,
    recurring.data,
    oneOffs.data,
    confirmations.data,
    payments.data,
    methods.data,
    foreground,
  ]);
}

/** Monta la sincronización de notificaciones (debajo de `RepositoryProvider`). */
export function ReminderSync(): null {
  useReminderSync();
  return null;
}
