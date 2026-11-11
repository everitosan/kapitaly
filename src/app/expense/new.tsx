import { useRouter } from 'expo-router';

import { ExpenseForm } from '@/features/expenses/ExpenseForm';

export default function NewExpenseScreen() {
  const router = useRouter();
  return <ExpenseForm target={{ kind: 'new' }} onDone={() => router.back()} />;
}
