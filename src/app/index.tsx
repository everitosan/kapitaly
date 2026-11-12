import { useRouter } from 'expo-router';

import { BalanceScreen } from '@/features/balance/BalanceScreen';

export default function Index() {
  const router = useRouter();
  return (
    <BalanceScreen
      onAdd={() => router.push('/expense/new')}
      onOpenSettings={() => router.push('/settings')}
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
