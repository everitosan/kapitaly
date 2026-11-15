import { and, eq, gt, isNull, lte } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';

import {
  canHide,
  canRemove as canRemoveCategory,
  type Category,
  type CategoryIconKey,
  type CategoryInput,
} from '@/domain/category';
import type { SyncMeta } from '@/domain/common';
import type { ChargeConfirmation, ChargeConfirmationInput } from '@/domain/confirmations';
import type { CardPayment, CardPaymentInput } from '@/domain/creditCard';
import type { OneOffExpense, OneOffExpenseInput } from '@/domain/oneOffExpense';
import {
  canArchive,
  canRemove,
  type ExpenseRef,
  type PaletteColorKey,
  type PaymentMethod,
  type PaymentMethodInput,
} from '@/domain/paymentMethod';
import type { RecurringExpense, RecurringExpenseInput } from '@/domain/recurringExpense';
import { DEFAULT_REMINDER_SETTINGS, type ReminderSettings } from '@/domain/reminderSettings';
import { snoozeUntil, type PendingSnooze } from '@/domain/pendingSnooze';

import type { AppDatabase } from '../sqlite/database';
import {
  cardPayments,
  categories,
  oneOffExpenses,
  paymentMethods,
  recurringChargeConfirmations,
  recurringExpenses,
  pendingSnoozes,
  reminderSettings,
  uiPreferences,
} from '../sqlite/schema';
import {
  assertCategoryInput,
  assertRule,
  CategoryRuleError,
  ChangeEmitter,
  mergeReminderSettings,
  nextTimestamp,
  NotFoundError,
} from './shared';
import type {
  CardPaymentRepository,
  CategoryRepository,
  ChargeConfirmationRepository,
  OneOffExpenseRepository,
  PaymentMethodRepository,
  PendingSnoozeRepository,
  RecurringExpenseRepository,
  ReminderSettingsRepository,
  Repositories,
  UiPreferencesRepository,
  Repository,
  RepositoryDeps,
} from './types';

type MetaTable = SQLiteTable & {
  id: SQLiteColumn;
  deletedAt: SQLiteColumn;
};

/**
 * Repositorio genérico sobre una tabla de Drizzle. Usa la base compartida `AppDatabase`, así que
 * corre igual con expo-sqlite (app) y better-sqlite3 (pruebas).
 */
class SqliteRepository<T extends SyncMeta, Input extends object> implements Repository<T, Input> {
  protected readonly emitter: ChangeEmitter;

  constructor(
    protected readonly db: AppDatabase,
    protected readonly table: MetaTable,
    protected readonly entity: string,
    protected readonly deps: RepositoryDeps,
    protected readonly fromRow: (row: Record<string, unknown>) => T,
    private readonly toValues: (input: Input) => Record<string, unknown>,
    emitter?: ChangeEmitter,
  ) {
    this.emitter = emitter ?? new ChangeEmitter();
  }

  protected selectRaw(id: string): Record<string, unknown> | undefined {
    return this.db.select().from(this.table).where(eq(this.table.id, id)).get() as
      Record<string, unknown> | undefined;
  }

  async list(): Promise<T[]> {
    const rows = this.db.select().from(this.table).where(isNull(this.table.deletedAt)).all();
    return (rows as Record<string, unknown>[]).map(this.fromRow);
  }

  async get(id: string): Promise<T | null> {
    const row = this.db
      .select()
      .from(this.table)
      .where(and(eq(this.table.id, id), isNull(this.table.deletedAt)))
      .get();
    return row ? this.fromRow(row as Record<string, unknown>) : null;
  }

  async create(input: Input): Promise<T> {
    const now = this.deps.now();
    const id = this.deps.newId();
    this.db
      .insert(this.table)
      .values({
        ...this.toValues(input),
        id,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as never)
      .run();
    this.emitter.emit();
    return (await this.get(id))!;
  }

  async update(id: string, input: Input): Promise<T> {
    const current = this.requireLive(id);
    this.patch(id, current, this.toValues(input));
    return (await this.get(id))!;
  }

  async remove(id: string): Promise<void> {
    const current = this.requireLive(id);
    this.patch(id, current, { deletedAt: this.deps.now() });
  }

  subscribe(listener: () => void): () => void {
    return this.emitter.subscribe(listener);
  }

  protected requireLive(id: string): T {
    const row = this.selectRaw(id);
    if (!row || row.deletedAt !== null) throw new NotFoundError(this.entity, id);
    return this.fromRow(row);
  }

  protected patch(id: string, current: T, changes: Record<string, unknown>): void {
    this.db
      .update(this.table)
      .set({ ...changes, updatedAt: nextTimestamp(this.deps.now(), current.updatedAt) } as never)
      .where(eq(this.table.id, id))
      .run();
    this.emitter.emit();
  }
}

const toPaymentMethod = (r: Record<string, unknown>): PaymentMethod => ({
  id: r.id as string,
  createdAt: r.createdAt as string,
  updatedAt: r.updatedAt as string,
  deletedAt: (r.deletedAt as string | null) ?? null,
  name: r.name as string,
  kind: r.kind as PaymentMethod['kind'],
  institutionId: (r.institutionId as string | null) ?? null,
  last4: (r.last4 as string | null) ?? null,
  color: (r.color as PaletteColorKey | null) ?? null,
  archivedAt: (r.archivedAt as string | null) ?? null,
  openingBalanceCents: (r.openingBalanceCents as number | null) ?? null,
  openingBalanceDate: (r.openingBalanceDate as string | null) ?? null,
  creditLimitCents: (r.creditLimitCents as number | null) ?? null,
  paymentDueDay: (r.paymentDueDay as number | null) ?? null,
  hasDigital: Boolean(r.hasDigital),
  digitalLast4: (r.digitalLast4 as string | null) ?? null,
});

const toRecurring = (r: Record<string, unknown>): RecurringExpense => ({
  id: r.id as string,
  createdAt: r.createdAt as string,
  updatedAt: r.updatedAt as string,
  deletedAt: (r.deletedAt as string | null) ?? null,
  name: r.name as string,
  amountCents: r.amountCents as number,
  intervalUnit: r.intervalUnit as RecurringExpense['intervalUnit'],
  intervalCount: r.intervalCount as number,
  anchorDate: r.anchorDate as string,
  endDate: (r.endDate as string | null) ?? null,
  paymentMethodId: r.paymentMethodId as string,
  cardVariant: (r.cardVariant as RecurringExpense['cardVariant']) ?? null,
  categoryId: r.categoryId as string,
});

const toOneOff = (r: Record<string, unknown>): OneOffExpense => ({
  id: r.id as string,
  createdAt: r.createdAt as string,
  updatedAt: r.updatedAt as string,
  deletedAt: (r.deletedAt as string | null) ?? null,
  description: r.description as string,
  amountCents: r.amountCents as number,
  date: r.date as string,
  paymentMethodId: r.paymentMethodId as string,
  cardVariant: (r.cardVariant as OneOffExpense['cardVariant']) ?? null,
  addsToCardBalance: r.addsToCardBalance === undefined ? true : Boolean(r.addsToCardBalance),
  categoryId: r.categoryId as string,
});

const toCategory = (r: Record<string, unknown>): Category => ({
  id: r.id as string,
  createdAt: r.createdAt as string,
  updatedAt: r.updatedAt as string,
  deletedAt: (r.deletedAt as string | null) ?? null,
  name: r.name as string,
  icon: r.icon as CategoryIconKey,
  builtin: Boolean(r.builtin),
  hiddenAt: (r.hiddenAt as string | null) ?? null,
});

class SqliteCategoryRepository
  extends SqliteRepository<Category, CategoryInput>
  implements CategoryRepository
{
  private allCategories(): Category[] {
    return (this.db.select().from(categories).all() as Record<string, unknown>[]).map(toCategory);
  }

  async create(input: CategoryInput): Promise<Category> {
    return super.create(assertCategoryInput(input, this.allCategories(), null));
  }

  async update(id: string, input: CategoryInput): Promise<Category> {
    const current = this.requireLive(id);
    return super.update(id, assertCategoryInput(input, this.allCategories(), current));
  }

  async remove(id: string): Promise<void> {
    const current = this.requireLive(id);
    if (!canRemoveCategory(current)) throw new CategoryRuleError({ category: 'locked' });
    this.patch(id, current, { deletedAt: this.deps.now() });
  }

  async hide(id: string): Promise<void> {
    const current = this.requireLive(id);
    if (!canHide(current)) throw new CategoryRuleError({ category: 'locked' });
    this.patch(id, current, { hiddenAt: this.deps.now() });
  }

  async unhide(id: string): Promise<void> {
    const current = this.requireLive(id);
    this.patch(id, current, { hiddenAt: null });
  }
}

class SqlitePaymentMethodRepository
  extends SqliteRepository<PaymentMethod, PaymentMethodInput>
  implements PaymentMethodRepository
{
  private allMethods(): PaymentMethod[] {
    return (this.db.select().from(paymentMethods).all() as Record<string, unknown>[]).map(
      toPaymentMethod,
    );
  }

  private expenseRefs(): ExpenseRef[] {
    const cols = {
      paymentMethodId: recurringExpenses.paymentMethodId,
      createdAt: recurringExpenses.createdAt,
      deletedAt: recurringExpenses.deletedAt,
    };
    const colsOne = {
      paymentMethodId: oneOffExpenses.paymentMethodId,
      createdAt: oneOffExpenses.createdAt,
      deletedAt: oneOffExpenses.deletedAt,
    };
    return [
      ...this.db.select(cols).from(recurringExpenses).all(),
      ...this.db.select(colsOne).from(oneOffExpenses).all(),
    ];
  }

  async remove(id: string): Promise<void> {
    const current = this.requireLive(id);
    assertRule(canRemove(id, this.allMethods(), this.expenseRefs()), id);
    this.patch(id, current, { deletedAt: this.deps.now() });
  }

  async archive(id: string): Promise<void> {
    const current = this.requireLive(id);
    assertRule(canArchive(id, this.allMethods()), id);
    this.patch(id, current, { archivedAt: this.deps.now() });
  }

  async unarchive(id: string): Promise<void> {
    const current = this.requireLive(id);
    this.patch(id, current, { archivedAt: null });
  }
}

const toCardPayment = (r: Record<string, unknown>): CardPayment => ({
  id: r.id as string,
  createdAt: r.createdAt as string,
  updatedAt: r.updatedAt as string,
  deletedAt: (r.deletedAt as string | null) ?? null,
  paymentMethodId: r.paymentMethodId as string,
  amountCents: r.amountCents as number,
  date: r.date as string,
  forDueDate: (r.forDueDate as string | null) ?? null,
});

const toConfirmation = (r: Record<string, unknown>): ChargeConfirmation => ({
  id: r.id as string,
  createdAt: r.createdAt as string,
  updatedAt: r.updatedAt as string,
  deletedAt: (r.deletedAt as string | null) ?? null,
  recurringExpenseId: r.recurringExpenseId as string,
  occurrenceDate: r.occurrenceDate as string,
  status: r.status as ChargeConfirmation['status'],
  amountCents: (r.amountCents as number | null) ?? null,
  paymentMethodId: r.paymentMethodId as string,
  addsToCardBalance: r.addsToCardBalance === undefined ? true : Boolean(r.addsToCardBalance),
});

class SqliteChargeConfirmationRepository
  extends SqliteRepository<ChargeConfirmation, ChargeConfirmationInput>
  implements ChargeConfirmationRepository
{
  async upsert(input: ChargeConfirmationInput): Promise<ChargeConfirmation> {
    const existing = this.db
      .select()
      .from(recurringChargeConfirmations)
      .where(
        and(
          eq(recurringChargeConfirmations.recurringExpenseId, input.recurringExpenseId),
          eq(recurringChargeConfirmations.occurrenceDate, input.occurrenceDate),
          isNull(recurringChargeConfirmations.deletedAt),
        ),
      )
      .get();
    return existing ? this.update(existing.id, input) : this.create(input);
  }
}

/** Repositorios sobre SQLite (Drizzle). El método inicial "Efectivo" lo crea la migración. */
const REMINDER_SETTINGS_ID = 'default';

/** Preferencias de notificaciones: la fila única `default` de `reminder_settings`. */
class SqliteReminderSettingsRepository implements ReminderSettingsRepository {
  private readonly emitter = new ChangeEmitter();

  constructor(
    private readonly db: AppDatabase,
    private readonly deps: RepositoryDeps,
  ) {}

  async get(): Promise<ReminderSettings> {
    const row = this.db
      .select()
      .from(reminderSettings)
      .where(eq(reminderSettings.id, REMINDER_SETTINGS_ID))
      .get();
    if (!row) return { ...DEFAULT_REMINDER_SETTINGS };
    return {
      chargesOn: row.chargesOn,
      chargesTime: row.chargesTime,
      dailyOn: row.dailyOn,
      dailyTime: row.dailyTime,
      idleOn: row.idleOn,
      idleDays: row.idleDays,
      idleTime: row.idleTime,
    };
  }

  async update(patch: Partial<ReminderSettings>): Promise<ReminderSettings> {
    const next = mergeReminderSettings(await this.get(), patch);
    const values = { ...next, updatedAt: this.deps.now() };
    this.db
      .insert(reminderSettings)
      .values({ id: REMINDER_SETTINGS_ID, ...values })
      .onConflictDoUpdate({ target: reminderSettings.id, set: values })
      .run();
    this.emitter.emit();
    return next;
  }

  subscribe(listener: () => void): () => void {
    return this.emitter.subscribe(listener);
  }
}

/** Pendientes pospuestos: una fila por clave con la fecha en que vence (ISO UTC, comparable como texto). */
class SqlitePendingSnoozeRepository implements PendingSnoozeRepository {
  private readonly emitter = new ChangeEmitter();

  constructor(
    private readonly db: AppDatabase,
    private readonly deps: RepositoryDeps,
  ) {}

  async list(): Promise<PendingSnooze[]> {
    return this.db
      .select()
      .from(pendingSnoozes)
      .where(gt(pendingSnoozes.until, this.deps.now()))
      .all();
  }

  async snooze(key: string): Promise<void> {
    const until = snoozeUntil(this.deps.now());
    this.db
      .insert(pendingSnoozes)
      .values({ key, until })
      .onConflictDoUpdate({ target: pendingSnoozes.key, set: { until } })
      .run();
    this.emitter.emit();
  }

  async purgeExpired(): Promise<void> {
    this.db.delete(pendingSnoozes).where(lte(pendingSnoozes.until, this.deps.now())).run();
  }

  subscribe(listener: () => void): () => void {
    return this.emitter.subscribe(listener);
  }
}

/** Preferencias de interfaz: una fila por clave. */
class SqliteUiPreferencesRepository implements UiPreferencesRepository {
  private readonly emitter = new ChangeEmitter();

  constructor(private readonly db: AppDatabase) {}

  async get(key: string): Promise<string | null> {
    const row = this.db.select().from(uiPreferences).where(eq(uiPreferences.key, key)).get();
    return row?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.db
      .insert(uiPreferences)
      .values({ key, value })
      .onConflictDoUpdate({ target: uiPreferences.key, set: { value } })
      .run();
    this.emitter.emit();
  }

  subscribe(listener: () => void): () => void {
    return this.emitter.subscribe(listener);
  }
}

export function createSqliteRepositories(db: AppDatabase, deps: RepositoryDeps): Repositories {
  const paymentMethodRepo = new SqlitePaymentMethodRepository(
    db,
    paymentMethods,
    'Método de pago',
    deps,
    toPaymentMethod,
    (i: PaymentMethodInput) => ({
      name: i.name,
      kind: i.kind,
      institutionId: i.institutionId,
      last4: i.last4,
      color: i.color,
      openingBalanceCents: i.openingBalanceCents,
      openingBalanceDate: i.openingBalanceDate,
      creditLimitCents: i.creditLimitCents,
      paymentDueDay: i.paymentDueDay,
      hasDigital: i.hasDigital,
      digitalLast4: i.digitalLast4,
    }),
  );
  const recurringRepo = new SqliteRepository<RecurringExpense, RecurringExpenseInput>(
    db,
    recurringExpenses,
    'Gasto recurrente',
    deps,
    toRecurring,
    (i) => ({
      name: i.name,
      amountCents: i.amountCents,
      intervalUnit: i.intervalUnit,
      intervalCount: i.intervalCount,
      anchorDate: i.anchorDate,
      endDate: i.endDate,
      paymentMethodId: i.paymentMethodId,
      cardVariant: i.cardVariant,
      categoryId: i.categoryId,
    }),
  );
  const oneOffRepo = new SqliteRepository<OneOffExpense, OneOffExpenseInput>(
    db,
    oneOffExpenses,
    'Gasto único',
    deps,
    toOneOff,
    (i) => ({
      description: i.description,
      amountCents: i.amountCents,
      date: i.date,
      paymentMethodId: i.paymentMethodId,
      cardVariant: i.cardVariant,
      addsToCardBalance: i.addsToCardBalance ?? true,
      categoryId: i.categoryId,
    }),
  );
  const cardPaymentRepo = new SqliteRepository<CardPayment, CardPaymentInput>(
    db,
    cardPayments,
    'Pago de tarjeta',
    deps,
    toCardPayment,
    (i) => ({
      paymentMethodId: i.paymentMethodId,
      amountCents: i.amountCents,
      date: i.date,
      forDueDate: i.forDueDate,
    }),
  );
  const confirmationRepo = new SqliteChargeConfirmationRepository(
    db,
    recurringChargeConfirmations,
    'Confirmación de cobro',
    deps,
    toConfirmation,
    (i: ChargeConfirmationInput) => ({
      recurringExpenseId: i.recurringExpenseId,
      occurrenceDate: i.occurrenceDate,
      status: i.status,
      amountCents: i.amountCents,
      paymentMethodId: i.paymentMethodId,
      addsToCardBalance: i.addsToCardBalance ?? true,
    }),
  );
  const categoryRepo = new SqliteCategoryRepository(
    db,
    categories,
    'Categoría',
    deps,
    toCategory,
    (i: CategoryInput) => ({ name: i.name, icon: i.icon }),
  );
  return {
    paymentMethods: paymentMethodRepo,
    categories: categoryRepo,
    recurringExpenses: recurringRepo as RecurringExpenseRepository,
    oneOffExpenses: oneOffRepo as OneOffExpenseRepository,
    cardPayments: cardPaymentRepo as CardPaymentRepository,
    chargeConfirmations: confirmationRepo,
    reminderSettings: new SqliteReminderSettingsRepository(db, deps),
    pendingSnoozes: new SqlitePendingSnoozeRepository(db, deps),
    uiPreferences: new SqliteUiPreferencesRepository(db),
  };
}
