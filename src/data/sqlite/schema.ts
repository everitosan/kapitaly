import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/*
 * Esquema local (SQLite). Convenciones compartidas por todas las tablas, pensadas para el sync de la v2:
 * - `id`: UUID generado en el dispositivo (o el id fijo de "Efectivo").
 * - `created_at` / `updated_at` / `deleted_at`: ISO 8601 UTC; nunca se borra físicamente (borrado lógico).
 * - Montos en centavos (INTEGER). Fechas civiles como TEXT `YYYY-MM-DD`.
 * - Referencias a métodos de pago sin FOREIGN KEY: la integridad la valida el dominio, para que un
 *   registro sincronizado pueda llegar antes que su método.
 */

const meta = {
  id: text('id').primaryKey(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
};

export const paymentMethods = sqliteTable('payment_methods', {
  ...meta,
  name: text('name').notNull(),
  kind: text('kind', { enum: ['credit', 'debit', 'cash', 'transfer'] }).notNull(),
  institutionId: text('institution_id'),
  last4: text('last4'),
  /** Clave de la paleta; NULL = usar el color de la institución. */
  color: text('color'),
  archivedAt: text('archived_at'),
  // Solo tarjetas de crédito (migración 0002).
  openingBalanceCents: integer('opening_balance_cents'),
  openingBalanceDate: text('opening_balance_date'),
  creditLimitCents: integer('credit_limit_cents'),
  paymentDueDay: integer('payment_due_day'),
  // Tarjeta digital (migración 0003): misma cuenta y saldo que la física.
  hasDigital: integer('has_digital', { mode: 'boolean' }).notNull().default(false),
  digitalLast4: text('digital_last4'),
});

/** Categorías de gasto: 8 de inicio (sembradas por la migración 0005 con ids fijos) y las del usuario. */
export const categories = sqliteTable('categories', {
  ...meta,
  name: text('name').notNull(),
  /** Clave del set de íconos de la app. */
  icon: text('icon').notNull(),
  builtin: integer('builtin', { mode: 'boolean' }).notNull().default(false),
  /** Solo de inicio: oculta para gastos nuevos. */
  hiddenAt: text('hidden_at'),
});

/** Id fijo de la categoría "Otro" (ver `OTHER_CATEGORY_ID` en el dominio). */
const OTHER_CATEGORY = '00000000-0000-4000-8000-000000000108';

export const recurringExpenses = sqliteTable('recurring_expenses', {
  ...meta,
  name: text('name').notNull(),
  amountCents: integer('amount_cents').notNull(),
  intervalUnit: text('interval_unit', { enum: ['month', 'year'] }).notNull(),
  intervalCount: integer('interval_count').notNull(),
  anchorDate: text('anchor_date').notNull(),
  endDate: text('end_date'),
  paymentMethodId: text('payment_method_id').notNull(),
  /** 'physical' | 'digital'; NULL si el método no tiene digital (o es anterior a la 0003). */
  cardVariant: text('card_variant', { enum: ['physical', 'digital'] }),
  /** Migración 0005: sin FOREIGN KEY, como los métodos; los gastos anteriores quedan en "Otro". */
  categoryId: text('category_id').notNull().default(OTHER_CATEGORY),
});

export const oneOffExpenses = sqliteTable('one_off_expenses', {
  ...meta,
  description: text('description').notNull(),
  amountCents: integer('amount_cents').notNull(),
  date: text('date').notNull(),
  paymentMethodId: text('payment_method_id').notNull(),
  cardVariant: text('card_variant', { enum: ['physical', 'digital'] }),
  /** Si suma al usado de una tarjeta de crédito (migración 0004); falso = ya venía en el saldo inicial. */
  addsToCardBalance: integer('adds_to_card_balance', { mode: 'boolean' }).notNull().default(true),
  categoryId: text('category_id').notNull().default(OTHER_CATEGORY),
});

/** Pagos a tarjetas de crédito (restan del usado; no son gastos). */
export const cardPayments = sqliteTable('card_payments', {
  ...meta,
  paymentMethodId: text('payment_method_id').notNull(),
  amountCents: integer('amount_cents').notNull(),
  date: text('date').notNull(),
  /** Fecha de pago que cubre; NULL si la tarjeta no tiene día de pago. */
  forDueDate: text('for_due_date'),
});

/** Respuesta del usuario a un cobro recurrente: confirmado (con su monto) o descartado. */
export const recurringChargeConfirmations = sqliteTable('recurring_charge_confirmations', {
  ...meta,
  recurringExpenseId: text('recurring_expense_id').notNull(),
  occurrenceDate: text('occurrence_date').notNull(),
  status: text('status', { enum: ['charged', 'skipped'] }).notNull(),
  amountCents: integer('amount_cents'),
  /** Método del gasto al confirmar. */
  paymentMethodId: text('payment_method_id').notNull(),
  /** Si suma al usado de una tarjeta de crédito (migración 0004); falso = ya venía en el saldo inicial. */
  addsToCardBalance: integer('adds_to_card_balance', { mode: 'boolean' }).notNull().default(true),
});

export const schema = {
  paymentMethods,
  categories,
  recurringExpenses,
  oneOffExpenses,
  cardPayments,
  recurringChargeConfirmations,
};
