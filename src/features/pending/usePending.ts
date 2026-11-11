import { pendingConfirmations, type PendingCharge } from '@/domain/confirmations';
import { pendingCardPayment, usedCents, type PendingCardPayment } from '@/domain/creditCard';
import { civilDateFromLocal, type CivilDate } from '@/domain/date';
import { isActiveMethod, type PaymentMethod } from '@/domain/paymentMethod';

import {
  useCardPayments,
  useChargeConfirmations,
  useOneOffExpenses,
  usePaymentMethods,
  useRecurringExpenses,
} from '../repositories';
import { chargeKey, paymentKey, pendingSession } from './session';

export interface PendingPayment extends PendingCardPayment {
  method: PaymentMethod;
}

/** Día local en que se registró un gasto (su `createdAt` está en UTC). */
export const registeredOnLocal = (iso: string): CivilDate => civilDateFromLocal(new Date(iso));

/** Cobros por confirmar y pagos de tarjeta vencidos, con y sin los pospuestos en esta sesión. */
export function usePending(today: CivilDate) {
  const methods = usePaymentMethods();
  const recurring = useRecurringExpenses();
  const oneOffs = useOneOffExpenses();
  const payments = useCardPayments();
  const confirmations = useChargeConfirmations();
  const loaded = [methods, recurring, oneOffs, payments, confirmations].every((l) => !l.loading);

  const allCharges: PendingCharge[] = loaded
    ? pendingConfirmations(recurring.data, confirmations.data, today, registeredOnLocal)
    : [];
  const allPayments: PendingPayment[] = loaded
    ? methods.data
        .filter((m) => m.kind === 'credit' && isActiveMethod(m))
        .flatMap((m) => {
          const used = usedCents(m, oneOffs.data, confirmations.data, payments.data);
          const p = pendingCardPayment(m, payments.data, today, used);
          return p ? [{ ...p, method: m }] : [];
        })
    : [];

  const charges = allCharges.filter(
    (c) => !pendingSession.isSnoozed(chargeKey(c.expense.id, c.date)),
  );
  const cardPayments = allPayments.filter(
    (p) => !pendingSession.isSnoozed(paymentKey(p.method.id, p.dueDate)),
  );
  return {
    loaded,
    allCharges,
    charges,
    cardPayments,
    count: charges.length + cardPayments.length,
    methods: methods.data,
  };
}
