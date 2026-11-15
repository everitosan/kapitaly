import { newExpenseUri } from '../../../plugins/withAndroidShortcuts';
import {
  checkUpdate,
  completeUpdate,
  isPinSupported,
  NEW_EXPENSE_URI,
  onUpdateProgress,
  requestPinNewExpense,
  startFlexibleUpdate,
} from '../index';

it('sin módulo nativo (Expo Go, iOS, web, pruebas) responde "no disponible"', () => {
  expect(isPinSupported()).toBe(false);
  expect(requestPinNewExpense()).toBe(false);
});

it('usa el mismo destino que el atajo estático del plugin', () => {
  expect(NEW_EXPENSE_URI).toBe(newExpenseUri('kapitalyexpenses'));
});

it('sin módulo nativo no hay actualizaciones y el flujo no se puede iniciar', async () => {
  expect(await checkUpdate()).toEqual({ status: 'none', availableVersionCode: null });
  expect(await startFlexibleUpdate()).toBe('failed');
  expect(() => completeUpdate()).not.toThrow();
  const stop = onUpdateProgress(jest.fn());
  expect(() => stop()).not.toThrow();
});
