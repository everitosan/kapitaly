import * as Notifications from 'expo-notifications';

import type { ScheduledReminder } from '@/domain/reminders';

import { permissionStatus, requestPermission, sync, targetOf } from '../scheduler';

const mock = Notifications as unknown as {
  __reset: () => void;
  __state: {
    scheduled: { identifier: string; content: Record<string, unknown>; trigger: unknown }[];
    permission: { granted: boolean; canAskAgain: boolean; status: string };
    nextAnswer: 'granted' | 'denied';
    channels: Record<string, unknown>;
  };
};

const daily: ScheduledReminder = {
  id: 'daily',
  kind: 'daily',
  trigger: { kind: 'daily', time: '21:00' },
  title: '¿Ya anotaste tus gastos de hoy?',
  body: 'Toca para agregar uno.',
  target: 'new-expense',
};
const charge: ScheduledReminder = {
  id: 'charges|2026-11-15',
  kind: 'charges',
  trigger: { kind: 'date', date: '2026-11-15', time: '10:00' },
  title: 'Hoy se cobra Netflix',
  body: '$219.00 con BBVA Azul. Confírmalo cuando pase.',
  target: 'pending',
};

beforeEach(() => mock.__reset());

describe('sync', () => {
  it('agenda el plan con disparadores diarios y por fecha en hora local', async () => {
    await sync([daily, charge]);
    expect(mock.__state.scheduled).toEqual([
      {
        identifier: 'daily',
        content: { title: daily.title, body: daily.body, data: { target: 'new-expense' } },
        trigger: { type: 'daily', hour: 21, minute: 0, channelId: 'reminders' },
      },
      {
        identifier: 'charges|2026-11-15',
        content: { title: charge.title, body: charge.body, data: { target: 'pending' } },
        trigger: { type: 'date', date: new Date(2026, 10, 15, 10, 0), channelId: 'reminders' },
      },
    ]);
    expect(mock.__state.channels.reminders).toMatchObject({ name: 'Recordatorios' });
  });

  it('reemplaza lo agendado: lo que ya no está en el plan se cancela', async () => {
    await sync([daily, charge]);
    await sync([daily]);
    expect(mock.__state.scheduled.map((n) => n.identifier)).toEqual(['daily']);
  });

  it('con un plan vacío no deja nada de la app y no toca lo ajeno', async () => {
    await Notifications.scheduleNotificationAsync({
      identifier: 'otra-cosa',
      content: { title: 'x' },
      trigger: null,
    });
    await sync([daily, charge]);
    await sync([]);
    expect(mock.__state.scheduled.map((n) => n.identifier)).toEqual(['otra-cosa']);
  });
});

describe('permiso', () => {
  it('pregunta la primera vez y queda concedido', async () => {
    expect(await permissionStatus()).toBe('ask');
    expect(await requestPermission()).toBe('granted');
    expect(await permissionStatus()).toBe('granted');
  });

  it('negado: queda bloqueado y no vuelve a preguntar', async () => {
    mock.__state.nextAnswer = 'denied';
    expect(await requestPermission()).toBe('blocked');
    mock.__state.nextAnswer = 'granted';
    expect(await requestPermission()).toBe('blocked');
  });
});

describe('targetOf', () => {
  const response = (data: unknown) =>
    ({ notification: { request: { content: { data } } } }) as Notifications.NotificationResponse;

  it('lee el destino de nuestras notificaciones', () => {
    expect(targetOf(response({ target: 'pending' }))).toBe('pending');
    expect(targetOf(response({ target: 'new-expense' }))).toBe('new-expense');
  });

  it('ignora otras', () => {
    expect(targetOf(response({ target: 'otra' }))).toBeNull();
    expect(targetOf(response(undefined))).toBeNull();
    expect(targetOf(null)).toBeNull();
  });
});
