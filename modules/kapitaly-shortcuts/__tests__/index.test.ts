import { newExpenseUri } from '../../../plugins/withAndroidShortcuts';
import { isPinSupported, NEW_EXPENSE_URI, requestPinNewExpense } from '../index';

it('sin módulo nativo (Expo Go, iOS, web, pruebas) responde "no disponible"', () => {
  expect(isPinSupported()).toBe(false);
  expect(requestPinNewExpense()).toBe(false);
});

it('usa el mismo destino que el atajo estático del plugin', () => {
  expect(NEW_EXPENSE_URI).toBe(newExpenseUri('kapitalyexpenses'));
});
