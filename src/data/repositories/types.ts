import type { ChargeConfirmation, ChargeConfirmationInput } from '@/domain/confirmations';
import type { CardPayment, CardPaymentInput } from '@/domain/creditCard';
import type { OneOffExpense, OneOffExpenseInput } from '@/domain/oneOffExpense';
import type { PaymentMethod, PaymentMethodInput } from '@/domain/paymentMethod';
import type { RecurringExpense, RecurringExpenseInput } from '@/domain/recurringExpense';

/**
 * Forma base de todos los repositorios. Es asíncrona aunque SQLite local sea rápido, porque la
 * implementación de la v2 (PocketBase en web) será de red. El repositorio asigna `id`, `createdAt`,
 * `updatedAt`, `deletedAt` (y `archivedAt` en métodos); quien lo usa nunca los manipula.
 */
export interface Repository<T, Input> {
  /** Registros vigentes (excluye eliminados). */
  list(): Promise<T[]>;
  /** Un registro vigente por id, o `null`. Incluye archivados. */
  get(id: string): Promise<T | null>;
  create(input: Input): Promise<T>;
  /** Lanza `NotFoundError` si no existe o está eliminado. */
  update(id: string, input: Input): Promise<T>;
  /** Borrado lógico (`deletedAt`). Lanza `NotFoundError` si no existe. */
  remove(id: string): Promise<void>;
  /** Avisa de cualquier cambio; devuelve la función para dejar de escuchar. */
  subscribe(listener: () => void): () => void;
}

export type RecurringExpenseRepository = Repository<RecurringExpense, RecurringExpenseInput>;
export type OneOffExpenseRepository = Repository<OneOffExpense, OneOffExpenseInput>;

export interface PaymentMethodRepository extends Repository<PaymentMethod, PaymentMethodInput> {
  /**
   * `remove` lanza `PaymentMethodInUseError` si lo usa algún gasto vigente y `LastActiveMethodError`
   * si es el último método activo.
   */
  remove(id: string): Promise<void>;
  /** Lanza `LastActiveMethodError` si es el último método activo. */
  archive(id: string): Promise<void>;
  unarchive(id: string): Promise<void>;
}

export type CardPaymentRepository = Repository<CardPayment, CardPaymentInput>;

export interface ChargeConfirmationRepository extends Repository<
  ChargeConfirmation,
  ChargeConfirmationInput
> {
  /** Crea o reemplaza la confirmación del cobro (gasto, fecha): a lo sumo una por cobro. */
  upsert(input: ChargeConfirmationInput): Promise<ChargeConfirmation>;
}

export interface Repositories {
  paymentMethods: PaymentMethodRepository;
  recurringExpenses: RecurringExpenseRepository;
  oneOffExpenses: OneOffExpenseRepository;
  cardPayments: CardPaymentRepository;
  chargeConfirmations: ChargeConfirmationRepository;
}

/** Dependencias inyectables (reloj e ids), para pruebas deterministas. */
export interface RepositoryDeps {
  now: () => string;
  newId: () => string;
}
