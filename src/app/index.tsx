import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';

import { BalanceScreen } from '@/features/balance/BalanceScreen';

export default function Index() {
  const router = useRouter();
  const focused = useIsFocused();
  // `?pending=<valor>` llega al tocar el aviso de cobros: abre la hoja de Pendientes.
  const { pending } = useLocalSearchParams<{ pending?: string }>();
  return (
    <BalanceScreen
      focused={focused}
      openPendingKey={pending}
      onAdd={() => router.push('/expense/new')}
      onOpenSettings={() => router.push('/settings')}
      onOpenMethods={() => router.push('/payment-methods')}
      onEdit={(kind, id) =>
        router.push(
          kind === 'oneOff'
            ? { pathname: '/expense/one-off/[id]', params: { id } }
            : { pathname: '/expense/recurring/[id]', params: { id } },
        )
      }
    />
  );
}
