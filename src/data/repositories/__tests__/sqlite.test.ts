import { eq } from 'drizzle-orm';

import {
  cardPayments,
  categories,
  oneOffExpenses,
  paymentMethods,
  recurringChargeConfirmations,
  recurringExpenses,
} from '../../sqlite/schema';
import { createTestDatabase } from '../../sqlite/testDatabase';
import { describeRepositoryContracts, type Table } from '../contract';
import { createSqliteRepositories } from '../sqlite';

const tables = {
  paymentMethods,
  categories,
  recurringExpenses,
  oneOffExpenses,
  cardPayments,
  chargeConfirmations: recurringChargeConfirmations,
} as const;

describeRepositoryContracts('SQLite (better-sqlite3)', (deps) => {
  const { db } = createTestDatabase();
  return {
    repos: createSqliteRepositories(db, deps),
    peek: async (table: Table, id: string) => {
      const t = tables[table];
      return db.select().from(t).where(eq(t.id, id)).get() as Record<string, unknown> | undefined;
    },
  };
});
