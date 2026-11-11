import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import {
  testDeps,
  sampleMethod,
  sampleOneOff,
  sampleRecurring,
} from '@/data/repositories/contract';
import { createInMemoryRepositories } from '@/data/repositories/inMemory';
import { CASH_METHOD_ID } from '@/domain/paymentMethod';

import {
  RepositoryProvider,
  useCardPayments,
  useChargeConfirmations,
  useOneOffExpenses,
  usePaymentMethods,
  useRecurringExpenses,
} from '../repositories';

function setup() {
  const repos = createInMemoryRepositories(testDeps());
  const wrapper = ({ children }: { children: ReactNode }) => (
    <RepositoryProvider repositories={repos}>{children}</RepositoryProvider>
  );
  return { repos, wrapper };
}

describe('hooks reactivos de repositorios', () => {
  it('usePaymentMethods se actualiza tras create, update, archive y remove', async () => {
    const { repos, wrapper } = setup();
    const { result } = await renderHook(() => usePaymentMethods(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data.map((m) => m.id)).toEqual([CASH_METHOD_ID]);

    let id = '';
    await act(async () => {
      id = (await repos.paymentMethods.create(sampleMethod())).id;
    });
    await waitFor(() => expect(result.current.data).toHaveLength(2));

    await act(async () => {
      await repos.paymentMethods.update(id, sampleMethod({ name: 'BBVA Oro' }));
    });
    await waitFor(() =>
      expect(result.current.data.find((m) => m.id === id)?.name).toBe('BBVA Oro'),
    );

    await act(async () => {
      await repos.paymentMethods.archive(id);
    });
    await waitFor(() =>
      expect(result.current.data.find((m) => m.id === id)?.archivedAt).not.toBeNull(),
    );

    await act(async () => {
      await repos.paymentMethods.remove(id);
    });
    await waitFor(() => expect(result.current.data).toHaveLength(1));
  });

  it('useRecurringExpenses y useOneOffExpenses reflejan altas y bajas', async () => {
    const { repos, wrapper } = setup();
    const rec = await renderHook(() => useRecurringExpenses(), { wrapper });
    const one = await renderHook(() => useOneOffExpenses(), { wrapper });
    await waitFor(() => expect(rec.result.current.loading).toBe(false));

    let recId = '';
    await act(async () => {
      recId = (await repos.recurringExpenses.create(sampleRecurring(CASH_METHOD_ID))).id;
      await repos.oneOffExpenses.create(sampleOneOff(CASH_METHOD_ID));
    });
    await waitFor(() => expect(rec.result.current.data).toHaveLength(1));
    await waitFor(() => expect(one.result.current.data).toHaveLength(1));

    await act(async () => {
      await repos.recurringExpenses.remove(recId);
    });
    await waitFor(() => expect(rec.result.current.data).toHaveLength(0));
  });

  it('fuera del proveedor lanza un error claro', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(renderHook(() => usePaymentMethods())).rejects.toThrow('RepositoryProvider');
    spy.mockRestore();
  });
});

describe('hooks de pagos y confirmaciones', () => {
  it('useCardPayments y useChargeConfirmations reflejan los cambios', async () => {
    const { repos, wrapper } = setup();
    const payments = await renderHook(() => useCardPayments(), { wrapper });
    const confirmations = await renderHook(() => useChargeConfirmations(), { wrapper });
    await waitFor(() => expect(payments.result.current.loading).toBe(false));
    await act(async () => {
      await repos.cardPayments.create({
        paymentMethodId: 'bbva',
        amountCents: 1000,
        date: '2026-12-03',
        forDueDate: '2026-12-05',
      });
      await repos.chargeConfirmations.upsert({
        recurringExpenseId: 'netflix',
        occurrenceDate: '2026-11-15',
        status: 'charged',
        amountCents: 21900,
        paymentMethodId: 'bbva',
      });
    });
    await waitFor(() => expect(payments.result.current.data).toHaveLength(1));
    await waitFor(() => expect(confirmations.result.current.data).toHaveLength(1));
  });
});
