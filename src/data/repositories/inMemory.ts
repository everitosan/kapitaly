import type { SyncMeta } from '@/domain/common';
import type { ChargeConfirmation, ChargeConfirmationInput } from '@/domain/confirmations';
import type { CardPayment, CardPaymentInput } from '@/domain/creditCard';
import type { OneOffExpense, OneOffExpenseInput } from '@/domain/oneOffExpense';
import {
  canArchive,
  canRemove,
  CASH_METHOD_ID,
  INITIAL_CASH_METHOD,
  type ExpenseRef,
  type PaymentMethod,
  type PaymentMethodInput,
} from '@/domain/paymentMethod';
import type { RecurringExpense, RecurringExpenseInput } from '@/domain/recurringExpense';

import { assertRule, ChangeEmitter, nextTimestamp, NotFoundError } from './shared';
import type {
  CardPaymentRepository,
  ChargeConfirmationRepository,
  OneOffExpenseRepository,
  PaymentMethodRepository,
  RecurringExpenseRepository,
  Repositories,
  Repository,
  RepositoryDeps,
} from './types';

/** Fecha fija del método inicial, igual que en la migración de SQLite. */
export const SEED_TIMESTAMP = '2026-01-01T00:00:00.000Z';

class InMemoryRepository<T extends SyncMeta, Input extends object> implements Repository<T, Input> {
  readonly rows = new Map<string, T>();
  protected readonly emitter = new ChangeEmitter();

  constructor(
    protected readonly entity: string,
    protected readonly deps: RepositoryDeps,
    private readonly build: (input: Input) => Omit<T, keyof SyncMeta>,
  ) {}

  async list(): Promise<T[]> {
    return [...this.rows.values()].filter((r) => r.deletedAt === null).map((r) => ({ ...r }));
  }

  async get(id: string): Promise<T | null> {
    const row = this.rows.get(id);
    return row && row.deletedAt === null ? { ...row } : null;
  }

  async create(input: Input): Promise<T> {
    const now = this.deps.now();
    const row = {
      ...this.build(input),
      id: this.deps.newId(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    } as T;
    this.rows.set(row.id, row);
    this.emitter.emit();
    return { ...row };
  }

  async update(id: string, input: Input): Promise<T> {
    const current = this.requireLive(id);
    const row = {
      ...current,
      ...this.build(input),
      updatedAt: nextTimestamp(this.deps.now(), current.updatedAt),
    };
    this.rows.set(id, row);
    this.emitter.emit();
    return { ...row };
  }

  async remove(id: string): Promise<void> {
    this.markDeleted(id);
  }

  subscribe(listener: () => void): () => void {
    return this.emitter.subscribe(listener);
  }

  protected requireLive(id: string): T {
    const row = this.rows.get(id);
    if (!row || row.deletedAt !== null) throw new NotFoundError(this.entity, id);
    return row;
  }

  protected patch(id: string, changes: Partial<T>): void {
    const current = this.requireLive(id);
    this.rows.set(id, {
      ...current,
      ...changes,
      updatedAt: nextTimestamp(this.deps.now(), current.updatedAt),
    });
    this.emitter.emit();
  }

  protected markDeleted(id: string): void {
    const now = this.deps.now();
    this.patch(id, { deletedAt: now } as Partial<T>);
  }
}

class InMemoryPaymentMethodRepository
  extends InMemoryRepository<PaymentMethod, PaymentMethodInput>
  implements PaymentMethodRepository
{
  constructor(
    deps: RepositoryDeps,
    private readonly expenseRefs: () => ExpenseRef[],
  ) {
    super('Método de pago', deps, (i) => ({ ...i, archivedAt: null }));
    this.rows.set(CASH_METHOD_ID, {
      ...INITIAL_CASH_METHOD,
      id: CASH_METHOD_ID,
      archivedAt: null,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      deletedAt: null,
    });
  }

  async update(id: string, input: PaymentMethodInput): Promise<PaymentMethod> {
    const archivedAt = this.requireLive(id).archivedAt;
    await super.update(id, input);
    this.rows.set(id, { ...this.rows.get(id)!, archivedAt });
    return { ...this.rows.get(id)! };
  }

  async remove(id: string): Promise<void> {
    this.requireLive(id);
    assertRule(canRemove(id, [...this.rows.values()], this.expenseRefs()), id);
    this.markDeleted(id);
  }

  async archive(id: string): Promise<void> {
    this.requireLive(id);
    assertRule(canArchive(id, [...this.rows.values()]), id);
    this.patch(id, { archivedAt: this.deps.now() });
  }

  async unarchive(id: string): Promise<void> {
    this.patch(id, { archivedAt: null });
  }
}

class InMemoryChargeConfirmationRepository
  extends InMemoryRepository<ChargeConfirmation, ChargeConfirmationInput>
  implements ChargeConfirmationRepository
{
  constructor(deps: RepositoryDeps) {
    super('Confirmación de cobro', deps, (i) => ({ ...i }));
  }

  async upsert(input: ChargeConfirmationInput): Promise<ChargeConfirmation> {
    const existing = [...this.rows.values()].find(
      (c) =>
        c.deletedAt === null &&
        c.recurringExpenseId === input.recurringExpenseId &&
        c.occurrenceDate === input.occurrenceDate,
    );
    return existing ? this.update(existing.id, input) : this.create(input);
  }
}

export interface InMemoryRepositories extends Repositories {
  /** Acceso a las filas crudas (incluye eliminadas), solo para pruebas. */
  raw: {
    paymentMethods: Map<string, PaymentMethod>;
    recurringExpenses: Map<string, RecurringExpense>;
    oneOffExpenses: Map<string, OneOffExpense>;
    cardPayments: Map<string, CardPayment>;
    chargeConfirmations: Map<string, ChargeConfirmation>;
  };
}

/** Repositorios en memoria: para pruebas de UI y como referencia del contrato. */
export function createInMemoryRepositories(deps: RepositoryDeps): InMemoryRepositories {
  const recurringExpenses = new InMemoryRepository<RecurringExpense, RecurringExpenseInput>(
    'Gasto recurrente',
    deps,
    (i) => ({ ...i }),
  );
  const oneOffExpenses = new InMemoryRepository<OneOffExpense, OneOffExpenseInput>(
    'Gasto único',
    deps,
    (i) => ({ ...i }),
  );
  const cardPayments = new InMemoryRepository<CardPayment, CardPaymentInput>(
    'Pago de tarjeta',
    deps,
    (i) => ({ ...i }),
  );
  const chargeConfirmations = new InMemoryChargeConfirmationRepository(deps);
  const paymentMethods = new InMemoryPaymentMethodRepository(deps, () => [
    ...recurringExpenses.rows.values(),
    ...oneOffExpenses.rows.values(),
  ]);
  return {
    paymentMethods,
    recurringExpenses: recurringExpenses as RecurringExpenseRepository,
    oneOffExpenses: oneOffExpenses as OneOffExpenseRepository,
    cardPayments: cardPayments as CardPaymentRepository,
    chargeConfirmations,
    raw: {
      paymentMethods: paymentMethods.rows,
      recurringExpenses: recurringExpenses.rows,
      oneOffExpenses: oneOffExpenses.rows,
      cardPayments: cardPayments.rows,
      chargeConfirmations: chargeConfirmations.rows,
    },
  };
}
