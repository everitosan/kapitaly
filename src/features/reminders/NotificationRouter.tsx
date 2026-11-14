import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { targetOf } from './scheduler';

/**
 * Lleva a donde corresponde al tocar una notificación: el aviso de cobros abre la hoja de Pendientes
 * y los de gastos abren "Nuevo gasto" (igual que el atajo). Atiende también la notificación que abrió
 * la app desde cero. Se monta junto al Stack, cuando ya se puede navegar.
 */
export function NotificationRouter(): null {
  const router = useRouter();

  useEffect(() => {
    const open = (response: Notifications.NotificationResponse | null) => {
      const target = targetOf(response);
      if (target === null) return;
      // Ya atendida: no repetirla en la siguiente apertura.
      Notifications.clearLastNotificationResponse();
      if (target === 'new-expense')
        router.push({ pathname: '/expense/new', params: { quick: '1' } });
      else router.navigate({ pathname: '/', params: { pending: String(Date.now()) } });
    };
    open(Notifications.getLastNotificationResponse());
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [router]);

  return null;
}
