import { useLocalSearchParams, useRouter } from 'expo-router';

import { ExpenseForm } from '@/features/expenses/ExpenseForm';

/** `?quick=1` llega desde el acceso directo "Nuevo gasto": el teclado se abre en el monto. */
export default function NewExpenseScreen() {
  const router = useRouter();
  const { quick } = useLocalSearchParams<{ quick?: string }>();
  return (
    <ExpenseForm
      target={{ kind: 'new' }}
      autoFocusAmount={quick === '1'}
      onDone={() => router.back()}
    />
  );
}
