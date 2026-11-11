import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { ChargeConfirmation } from '@/domain/confirmations';
import type { CardPayment } from '@/domain/creditCard';
import type { OneOffExpense } from '@/domain/oneOffExpense';
import type { PaymentMethod } from '@/domain/paymentMethod';
import type { RecurringExpense } from '@/domain/recurringExpense';
import type { Repositories, Repository } from '@/data/repositories/types';

const RepositoryContext = createContext<Repositories | null>(null);

/** Inyecta los repositorios (SQLite en la app, en memoria en pruebas; PocketBase en la web de la v2). */
export function RepositoryProvider({
  repositories,
  children,
}: {
  repositories: Repositories;
  children: ReactNode;
}) {
  return <RepositoryContext.Provider value={repositories}>{children}</RepositoryContext.Provider>;
}

export function useRepositories(): Repositories {
  const repos = useContext(RepositoryContext);
  if (!repos) throw new Error('useRepositories debe usarse dentro de <RepositoryProvider>');
  return repos;
}

export interface LiveList<T> {
  data: T[];
  loading: boolean;
}

/** Lista de un repositorio que se recarga en cada cambio notificado por `subscribe`. */
function useLiveList<T>(repo: Repository<T, never>): LiveList<T> {
  const [state, setState] = useState<LiveList<T>>({ data: [], loading: true });

  useEffect(() => {
    let active = true;
    let version = 0;
    const load = () => {
      const current = ++version;
      repo.list().then((data) => {
        // Ignora respuestas viejas si llegaron fuera de orden.
        if (active && current === version) setState({ data, loading: false });
      });
    };
    load();
    const unsubscribe = repo.subscribe(load);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [repo]);

  return state;
}

/** Métodos de pago vigentes, incluidos los archivados (la UI los separa). */
export const usePaymentMethods = (): LiveList<PaymentMethod> =>
  useLiveList(useRepositories().paymentMethods as Repository<PaymentMethod, never>);

export const useRecurringExpenses = (): LiveList<RecurringExpense> =>
  useLiveList(useRepositories().recurringExpenses as Repository<RecurringExpense, never>);

export const useOneOffExpenses = (): LiveList<OneOffExpense> =>
  useLiveList(useRepositories().oneOffExpenses as Repository<OneOffExpense, never>);

export const useCardPayments = (): LiveList<CardPayment> =>
  useLiveList(useRepositories().cardPayments as Repository<CardPayment, never>);

export const useChargeConfirmations = (): LiveList<ChargeConfirmation> =>
  useLiveList(useRepositories().chargeConfirmations as Repository<ChargeConfirmation, never>);
