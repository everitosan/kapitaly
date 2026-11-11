import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import type { RecurringExpense } from '@/domain/recurringExpense';
import { ExpenseForm } from '@/features/expenses/ExpenseForm';
import { useRepositories } from '@/features/repositories';

export default function EditRecurringScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const repos = useRepositories();
  const [expense, setExpense] = useState<RecurringExpense | null>(null);
  useEffect(() => {
    repos.recurringExpenses.get(id).then(setExpense);
  }, [id, repos]);
  if (!expense) return null;
  return <ExpenseForm target={{ kind: 'recurring', expense }} onDone={() => router.back()} />;
}
