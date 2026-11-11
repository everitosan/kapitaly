import { Link, useRouter } from 'expo-router';
import { Text } from 'react-native';

import { BalanceScreen } from '@/features/balance/BalanceScreen';

export default function Index() {
  const router = useRouter();
  return (
    <BalanceScreen
      onAdd={() => router.push('/expense/new')}
      onOpenMethods={() => router.push('/payment-methods')}
      onEdit={(kind, id) =>
        router.push(
          kind === 'oneOff'
            ? { pathname: '/expense/one-off/[id]', params: { id } }
            : { pathname: '/expense/recurring/[id]', params: { id } },
        )
      }
      extra={
        __DEV__ ? (
          <Link href="/dev/components" style={{ textAlign: 'center', marginTop: 24, opacity: 0.6 }}>
            <Text>Catálogo de componentes (desarrollo)</Text>
          </Link>
        ) : null
      }
    />
  );
}
