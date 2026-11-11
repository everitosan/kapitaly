/**
 * Suites de contrato: toda implementación de los repositorios (en memoria, SQLite y, en la v2,
 * PocketBase) debe pasarlas. Se importan desde los archivos de prueba de cada implementación.
 */
import type { ChargeConfirmation, ChargeConfirmationInput } from '@/domain/confirmations';
import type { CardPayment, CardPaymentInput } from '@/domain/creditCard';
import type { OneOffExpenseInput } from '@/domain/oneOffExpense';
import { CASH_METHOD_ID, NO_CARD_DATA, type PaymentMethodInput } from '@/domain/paymentMethod';
import type { RecurringExpenseInput } from '@/domain/recurringExpense';

import { LastActiveMethodError, NotFoundError, PaymentMethodInUseError } from './shared';
import type { Repositories, Repository, RepositoryDeps } from './types';

export type Table =
  | 'paymentMethods'
  | 'recurringExpenses'
  | 'oneOffExpenses'
  | 'cardPayments'
  | 'chargeConfirmations';

export interface ContractHarness {
  repos: Repositories;
  /** Lee el registro tal como está guardado, aunque esté eliminado. */
  peek: (table: Table, id: string) => Promise<Record<string, unknown> | undefined>;
}

export type HarnessFactory = (deps: RepositoryDeps) => ContractHarness;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Reloj de prueba que avanza un segundo en cada lectura, e ids UUID v4 válidos y únicos. */
export function testDeps(): RepositoryDeps {
  let t = Date.UTC(2026, 10, 11, 12, 0, 0);
  let n = 0;
  return {
    now: () => new Date((t += 1000)).toISOString(),
    newId: () => `00000000-0000-4000-8000-${String(++n + 100).padStart(12, '0')}`,
  };
}

export const sampleMethod = (over: Partial<PaymentMethodInput> = {}): PaymentMethodInput => ({
  name: 'BBVA Azul',
  kind: 'credit',
  institutionId: 'bbva-mx',
  last4: '4521',
  color: null,
  ...NO_CARD_DATA,
  ...over,
});

export const sampleRecurring = (
  paymentMethodId: string,
  over: Partial<RecurringExpenseInput> = {},
): RecurringExpenseInput => ({
  name: 'Netflix',
  amountCents: 21900,
  intervalUnit: 'month',
  intervalCount: 1,
  anchorDate: '2026-11-15',
  endDate: null,
  paymentMethodId,
  cardVariant: null,
  ...over,
});

export const sampleOneOff = (
  paymentMethodId: string,
  over: Partial<OneOffExpenseInput> = {},
): OneOffExpenseInput => ({
  description: 'Recarga metro',
  amountCents: 10000,
  date: '2026-11-11',
  paymentMethodId,
  cardVariant: null,
  ...over,
});

interface GenericCase<T, Input> {
  table: Table;
  repo: (h: ContractHarness) => Repository<T, Input>;
  /** Primer input y un input distinto para editar. */
  input: (h: ContractHarness) => Promise<[Input, Input]>;
  /** Registros que ya existen al crear el arnés (p. ej. "Efectivo"). */
  baseline: number;
}

function describeGenericContract<
  T extends { id: string; createdAt: string; updatedAt: string; deletedAt: string | null },
  Input extends object,
>(name: string, factory: HarnessFactory, c: GenericCase<T, Input>) {
  describe(`${name}: contrato base`, () => {
    let h: ContractHarness;
    let repo: Repository<T, Input>;
    beforeEach(() => {
      h = factory(testDeps());
      repo = c.repo(h);
    });

    it('crea con UUID, metadatos y los datos del input', async () => {
      const [input] = await c.input(h);
      const created = await repo.create(input);
      expect(created.id).toMatch(UUID);
      expect(created.createdAt).toBe(created.updatedAt);
      expect(created.deletedAt).toBeNull();
      expect(created).toMatchObject(input);
      expect(await repo.get(created.id)).toEqual(created);
    });

    it('dos altas con los mismos datos tienen ids distintos', async () => {
      const [input] = await c.input(h);
      const a = await repo.create(input);
      const b = await repo.create(input);
      expect(a.id).not.toBe(b.id);
      expect(await repo.list()).toHaveLength(c.baseline + 2);
    });

    it('editar conserva id y fecha de creación y avanza la de actualización', async () => {
      const [input, changed] = await c.input(h);
      const created = await repo.create(input);
      const updated = await repo.update(created.id, changed);
      expect(updated.id).toBe(created.id);
      expect(updated.createdAt).toBe(created.createdAt);
      expect(updated.updatedAt > created.updatedAt).toBe(true);
      expect(updated).toMatchObject(changed);
      expect(await repo.get(created.id)).toEqual(updated);
    });

    it('borrado lógico: deja de listarse pero se conserva con su fecha de eliminación', async () => {
      const [input] = await c.input(h);
      const created = await repo.create(input);
      await repo.remove(created.id);
      expect((await repo.list()).map((r) => r.id)).not.toContain(created.id);
      expect(await repo.get(created.id)).toBeNull();
      const raw = await h.peek(c.table, created.id);
      expect(raw).toBeDefined();
      expect(typeof raw?.deletedAt).toBe('string');
      expect((raw?.updatedAt as string) > created.updatedAt).toBe(true);
    });

    it('operaciones sobre ids inexistentes o eliminados', async () => {
      const [input, changed] = await c.input(h);
      expect(await repo.get('no-existe')).toBeNull();
      await expect(repo.update('no-existe', changed)).rejects.toBeInstanceOf(NotFoundError);
      const created = await repo.create(input);
      await repo.remove(created.id);
      await expect(repo.update(created.id, changed)).rejects.toBeInstanceOf(NotFoundError);
      await expect(repo.remove(created.id)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('notifica a los suscriptores en cada cambio y deja de hacerlo al desuscribirse', async () => {
      const [input, changed] = await c.input(h);
      const listener = jest.fn();
      const unsubscribe = repo.subscribe(listener);
      const created = await repo.create(input);
      await repo.update(created.id, changed);
      await repo.remove(created.id);
      expect(listener).toHaveBeenCalledTimes(3);
      unsubscribe();
      await repo.create(input);
      expect(listener).toHaveBeenCalledTimes(3);
    });
  });
}

export function describeRepositoryContracts(name: string, factory: HarnessFactory) {
  describeGenericContract(`${name} · métodos de pago`, factory, {
    table: 'paymentMethods',
    repo: (h) => h.repos.paymentMethods,
    input: async () => [
      sampleMethod(),
      sampleMethod({
        name: 'BBVA Oro',
        color: 'lime',
        last4: null,
        hasDigital: true,
        digitalLast4: '7788',
        openingBalanceCents: 1200000,
        openingBalanceDate: '2026-11-01',
        creditLimitCents: 5000000,
        paymentDueDay: 5,
      }),
    ],
    baseline: 1,
  });

  describeGenericContract(`${name} · gastos recurrentes`, factory, {
    table: 'recurringExpenses',
    repo: (h) => h.repos.recurringExpenses,
    input: async () => [
      sampleRecurring(CASH_METHOD_ID),
      sampleRecurring(CASH_METHOD_ID, {
        name: 'Netflix Premium',
        amountCents: 29900,
        intervalCount: 2,
        endDate: '2027-11-15',
        cardVariant: 'digital',
      }),
    ],
    baseline: 0,
  });

  describeGenericContract(`${name} · gastos únicos`, factory, {
    table: 'oneOffExpenses',
    repo: (h) => h.repos.oneOffExpenses,
    input: async () => [
      sampleOneOff(CASH_METHOD_ID),
      sampleOneOff(CASH_METHOD_ID, {
        description: 'Farmacia',
        amountCents: 23850,
        date: '2026-11-09',
        cardVariant: 'physical',
      }),
    ],
    baseline: 0,
  });

  describeGenericContract<CardPayment, CardPaymentInput>(`${name} · pagos de tarjeta`, factory, {
    table: 'cardPayments',
    repo: (h) => h.repos.cardPayments,
    input: async () => [
      {
        paymentMethodId: 'bbva',
        amountCents: 500000,
        date: '2026-12-03',
        forDueDate: '2026-12-05',
      },
      { paymentMethodId: 'bbva', amountCents: 450000, date: '2026-12-04', forDueDate: null },
    ],
    baseline: 0,
  });

  describeGenericContract<ChargeConfirmation, ChargeConfirmationInput>(
    `${name} · confirmaciones de cobro`,
    factory,
    {
      table: 'chargeConfirmations',
      repo: (h) => h.repos.chargeConfirmations,
      input: async () => [
        {
          recurringExpenseId: 'netflix',
          occurrenceDate: '2026-11-15',
          status: 'charged',
          amountCents: 21900,
          paymentMethodId: 'bbva',
        },
        {
          recurringExpenseId: 'netflix',
          occurrenceDate: '2026-11-15',
          status: 'skipped',
          amountCents: null,
          paymentMethodId: 'bbva',
        },
      ],
      baseline: 0,
    },
  );

  describe(`${name} · confirmaciones: a lo sumo una por cobro`, () => {
    it('upsert reemplaza la confirmación del mismo cobro y crea las de otros', async () => {
      const h = factory(testDeps());
      const base = { recurringExpenseId: 'netflix', paymentMethodId: 'bbva' } as const;
      const first = await h.repos.chargeConfirmations.upsert({
        ...base,
        occurrenceDate: '2026-11-15',
        status: 'charged',
        amountCents: 21900,
      });
      const again = await h.repos.chargeConfirmations.upsert({
        ...base,
        occurrenceDate: '2026-11-15',
        status: 'charged',
        amountCents: 24900,
      });
      expect(again.id).toBe(first.id);
      expect(again.amountCents).toBe(24900);
      await h.repos.chargeConfirmations.upsert({
        ...base,
        occurrenceDate: '2026-12-15',
        status: 'skipped',
        amountCents: null,
      });
      expect(await h.repos.chargeConfirmations.list()).toHaveLength(2);
    });
  });

  describe(`${name} · métodos de pago: reglas`, () => {
    let h: ContractHarness;
    beforeEach(() => {
      h = factory(testDeps());
    });

    it('incluye el método inicial "Efectivo" con su id fijo', async () => {
      const list = await h.repos.paymentMethods.list();
      expect(list).toEqual([
        expect.objectContaining({
          id: CASH_METHOD_ID,
          name: 'Efectivo',
          kind: 'cash',
          archivedAt: null,
        }),
      ]);
    });

    it('archivar y reactivar; el archivado sigue listado y resolviéndose', async () => {
      const m = await h.repos.paymentMethods.create(sampleMethod());
      await h.repos.recurringExpenses.create(sampleRecurring(m.id));
      await h.repos.paymentMethods.archive(m.id);
      const archived = await h.repos.paymentMethods.get(m.id);
      expect(typeof archived?.archivedAt).toBe('string');
      expect(archived!.updatedAt > m.updatedAt).toBe(true);
      expect((await h.repos.paymentMethods.list()).map((x) => x.id)).toContain(m.id);
      await h.repos.paymentMethods.unarchive(m.id);
      expect((await h.repos.paymentMethods.get(m.id))?.archivedAt).toBeNull();
    });

    it('no elimina un método en uso por gastos vigentes', async () => {
      const m = await h.repos.paymentMethods.create(sampleMethod());
      await h.repos.recurringExpenses.create(sampleRecurring(m.id));
      await h.repos.oneOffExpenses.create(sampleOneOff(m.id));
      const removedOneOff = await h.repos.oneOffExpenses.create(sampleOneOff(m.id));
      await h.repos.oneOffExpenses.remove(removedOneOff.id);
      const error = await h.repos.paymentMethods.remove(m.id).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(PaymentMethodInUseError);
      expect((error as PaymentMethodInUseError).uses).toBe(2);
      expect(await h.repos.paymentMethods.get(m.id)).not.toBeNull();
    });

    it('elimina un método sin uso', async () => {
      const m = await h.repos.paymentMethods.create(sampleMethod());
      await h.repos.paymentMethods.remove(m.id);
      expect(await h.repos.paymentMethods.get(m.id)).toBeNull();
    });

    it('impide archivar o eliminar el último método activo', async () => {
      await expect(h.repos.paymentMethods.archive(CASH_METHOD_ID)).rejects.toBeInstanceOf(
        LastActiveMethodError,
      );
      await expect(h.repos.paymentMethods.remove(CASH_METHOD_ID)).rejects.toBeInstanceOf(
        LastActiveMethodError,
      );
      const m = await h.repos.paymentMethods.create(sampleMethod());
      await h.repos.paymentMethods.archive(CASH_METHOD_ID);
      await expect(h.repos.paymentMethods.archive(m.id)).rejects.toBeInstanceOf(
        LastActiveMethodError,
      );
    });

    it('los cambios de archivado notifican a los suscriptores', async () => {
      const m = await h.repos.paymentMethods.create(sampleMethod());
      const listener = jest.fn();
      h.repos.paymentMethods.subscribe(listener);
      await h.repos.paymentMethods.archive(m.id);
      await h.repos.paymentMethods.unarchive(m.id);
      expect(listener).toHaveBeenCalledTimes(2);
    });
  });
}
