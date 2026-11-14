import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';

import { parseCivilDate } from '@/domain/date';
import { parseClockTime } from '@/domain/reminderSettings';
import type { ReminderTarget, ScheduledReminder } from '@/domain/reminders';

/*
 * Único módulo que habla con expo-notifications. Traduce el plan del dominio a notificaciones
 * locales del sistema, y maneja el canal de Android y el permiso.
 */

export const REMINDER_CHANNEL_ID = 'reminders';

/** Ids que agenda la app; al sincronizar solo se tocan estos. */
const isOwnId = (id: string) =>
  id === 'daily' || id.startsWith('charges|') || id.startsWith('idle|');

/**
 * Permiso de notificaciones: `granted`; `ask` si todavía se puede pedir; `blocked` si el usuario lo
 * negó y el sistema ya no deja preguntar (solo desde sus ajustes).
 */
export type ReminderPermission = 'granted' | 'ask' | 'blocked';

/** Muestra las notificaciones aunque la app esté abierta. Se llama una vez al iniciar. */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Canal de Android "Recordatorios". Debe existir antes de pedir permiso (Android 13+). */
export async function ensureChannel(): Promise<void> {
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Recordatorios',
    importance: AndroidImportance.DEFAULT,
  });
}

const toPermission = (p: { granted: boolean; canAskAgain: boolean }): ReminderPermission =>
  p.granted ? 'granted' : p.canAskAgain ? 'ask' : 'blocked';

export async function permissionStatus(): Promise<ReminderPermission> {
  return toPermission(await Notifications.getPermissionsAsync());
}

/** Pide el permiso si todavía se puede; devuelve el estado final. */
export async function requestPermission(): Promise<ReminderPermission> {
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || !current.canAskAgain) return toPermission(current);
  return toPermission(await Notifications.requestPermissionsAsync());
}

function toTrigger(reminder: ScheduledReminder): Notifications.NotificationTriggerInput {
  const { hour, minute } = parseClockTime(reminder.trigger.time);
  if (reminder.trigger.kind === 'daily') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: REMINDER_CHANNEL_ID,
    };
  }
  const { year, month, day } = parseCivilDate(reminder.trigger.date);
  return {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    // Hora local del teléfono.
    date: new Date(year, month - 1, day, hour, minute),
    channelId: REMINDER_CHANNEL_ID,
  };
}

/**
 * Deja agendado exactamente el plan: cancela lo que la app había agendado y agenda de nuevo. Son
 * pocas notificaciones, y rehacerlas evita estados a medias.
 */
export async function sync(plan: readonly ScheduledReminder[]): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => isOwnId(n.identifier))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
  if (plan.length === 0) return;
  await ensureChannel();
  for (const reminder of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: { title: reminder.title, body: reminder.body, data: { target: reminder.target } },
      trigger: toTrigger(reminder),
    });
  }
}

/** Destino de una notificación tocada, si es de las nuestras. */
export function targetOf(
  response: Notifications.NotificationResponse | null,
): ReminderTarget | null {
  const target = response?.notification.request.content.data?.target;
  return target === 'pending' || target === 'new-expense' ? target : null;
}
