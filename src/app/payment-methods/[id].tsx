import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import type { PaymentMethod } from '@/domain/paymentMethod';
import { PaymentMethodForm } from '@/features/paymentMethods/PaymentMethodForm';
import { useRepositories } from '@/features/repositories';

export default function PaymentMethodScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const repos = useRepositories();
  const isNew = id === 'new';
  const [method, setMethod] = useState<PaymentMethod | null | undefined>(isNew ? null : undefined);

  useEffect(() => {
    if (!isNew) repos.paymentMethods.get(id).then(setMethod);
  }, [id, isNew, repos]);

  if (method === undefined) return null;
  return <PaymentMethodForm method={method} onDone={() => router.back()} />;
}
