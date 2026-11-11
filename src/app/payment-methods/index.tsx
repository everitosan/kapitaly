import { useRouter } from 'expo-router';

import { PaymentMethodList } from '@/features/paymentMethods/PaymentMethodList';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  return (
    <PaymentMethodList
      onBack={() => router.back()}
      onOpen={(id) => router.push({ pathname: '/payment-methods/[id]', params: { id } })}
      onAdd={() => router.push({ pathname: '/payment-methods/[id]', params: { id: 'new' } })}
    />
  );
}
