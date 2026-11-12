import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import { BUILTIN_CATEGORIES, OTHER_CATEGORY_ID } from '@/domain/category';
import { CASH_METHOD_ID } from '@/domain/paymentMethod';

import {
  cardPayments,
  categories,
  oneOffExpenses,
  paymentMethods,
  recurringExpenses,
} from '../schema';

const MIGRATIONS = path.resolve(__dirname, '../../../../drizzle');

/** Copia la carpeta de migraciones dejando solo las primeras `count` entradas del journal. */
function folderUpTo(count: number): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kapitaly-mig-'));
  fs.cpSync(MIGRATIONS, dir, { recursive: true });
  const journalPath = path.join(dir, 'meta', '_journal.json');
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
  journal.entries = journal.entries.slice(0, count);
  fs.writeFileSync(journalPath, JSON.stringify(journal));
  return dir;
}

describe('actualización de esquema 0001 → 0002', () => {
  it('conserva los datos existentes y agrega las columnas y tablas nuevas', () => {
    const client = new Database(':memory:');
    const db = drizzle(client);
    migrate(db, { migrationsFolder: folderUpTo(2) });

    // Datos creados con la versión anterior (sin columnas de tarjeta).
    client.exec(`INSERT INTO payment_methods (id, created_at, updated_at, name, kind, institution_id, last4, color)
                 VALUES ('bbva', '2026-11-01T00:00:00Z', '2026-11-01T00:00:00Z', 'BBVA Azul', 'credit', 'bbva-mx', '4521', NULL)`);
    client.exec(`INSERT INTO recurring_expenses (id, created_at, updated_at, name, amount_cents, interval_unit, interval_count, anchor_date, payment_method_id)
                 VALUES ('netflix', '2026-11-01T00:00:00Z', '2026-11-01T00:00:00Z', 'Netflix', 21900, 'month', 1, '2026-01-15', 'bbva')`);

    migrate(db, { migrationsFolder: MIGRATIONS });

    const methods = db.select().from(paymentMethods).all();
    expect(methods.map((m) => m.id).sort()).toEqual(['bbva', CASH_METHOD_ID].sort());
    expect(methods.find((m) => m.id === 'bbva')).toMatchObject({
      name: 'BBVA Azul',
      openingBalanceCents: null,
      creditLimitCents: null,
      paymentDueDay: null,
    });
    expect(db.select().from(recurringExpenses).all()).toHaveLength(1);
    expect(db.select().from(cardPayments).all()).toEqual([]);
  });
});

describe('actualización de esquema 0002 → 0003', () => {
  it('los gastos existentes quedan con variante NULL y los métodos sin digital', () => {
    const client = new Database(':memory:');
    const db = drizzle(client);
    migrate(db, { migrationsFolder: folderUpTo(3) });
    client.exec(`INSERT INTO one_off_expenses (id, created_at, updated_at, description, amount_cents, date, payment_method_id)
                 VALUES ('metro', '2026-11-03T00:00:00Z', '2026-11-03T00:00:00Z', 'Recarga metro', 10000, '2026-11-03', '${CASH_METHOD_ID}')`);
    migrate(db, { migrationsFolder: MIGRATIONS });
    expect(db.select().from(oneOffExpenses).all()[0]).toMatchObject({
      description: 'Recarga metro',
      cardVariant: null,
    });
    expect(db.select().from(paymentMethods).all()[0]).toMatchObject({
      id: CASH_METHOD_ID,
      hasDigital: false,
      digitalLast4: null,
    });
  });
});

describe('actualización de esquema 0004 → 0005', () => {
  it('siembra las 8 categorías de inicio y deja los gastos existentes en "Otro"', () => {
    const client = new Database(':memory:');
    const db = drizzle(client);
    migrate(db, { migrationsFolder: folderUpTo(5) });
    client.exec(`INSERT INTO recurring_expenses (id, created_at, updated_at, name, amount_cents, interval_unit, interval_count, anchor_date, payment_method_id)
                 VALUES ('netflix', '2026-11-01T00:00:00Z', '2026-11-01T00:00:00Z', 'Netflix', 21900, 'month', 1, '2026-01-15', '${CASH_METHOD_ID}')`);
    client.exec(`INSERT INTO one_off_expenses (id, created_at, updated_at, description, amount_cents, date, payment_method_id)
                 VALUES ('metro', '2026-11-03T00:00:00Z', '2026-11-03T00:00:00Z', 'Recarga metro', 10000, '2026-11-03', '${CASH_METHOD_ID}')`);
    migrate(db, { migrationsFolder: MIGRATIONS });

    const cats = db.select().from(categories).all();
    expect(cats.map((c) => c.id).sort()).toEqual(BUILTIN_CATEGORIES.map((c) => c.id).sort());
    for (const b of BUILTIN_CATEGORIES)
      expect(cats.find((c) => c.id === b.id)).toMatchObject({
        name: b.name,
        icon: b.icon,
        builtin: true,
        hiddenAt: null,
        deletedAt: null,
      });
    expect(db.select().from(recurringExpenses).all()[0]).toMatchObject({
      name: 'Netflix',
      categoryId: OTHER_CATEGORY_ID,
    });
    expect(db.select().from(oneOffExpenses).all()[0]).toMatchObject({
      description: 'Recarga metro',
      categoryId: OTHER_CATEGORY_ID,
    });
  });
});
