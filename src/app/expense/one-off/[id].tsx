import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import type { OneOffExpense } from '@/domain/oneOffExpense';
import { ExpenseForm } from '@/features/expenses/ExpenseForm';
import { useRepositories } from '@/features/repositories';

export default function EditOneOffScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const repos = useRepositories();
  const [expense, setExpense] = useState<OneOffExpense | null>(null);
  useEffect(() => {
    repos.oneOffExpenses.get(id).then(setExpense);
  }, [id, repos]);
  if (!expense) return null;
  return <ExpenseForm target={{ kind: 'oneOff', expense }} onDone={() => router.back()} />;
}
