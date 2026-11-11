import path from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import type { AppDatabase } from './database';
import { schema } from './schema';

/** Solo para pruebas en Node: base en memoria con las mismas migraciones de la app. */
export function createTestDatabase(): {
  db: AppDatabase;
  client: Database.Database;
  migrateAgain: () => void;
} {
  const client = new Database(':memory:');
  const db = drizzle(client, { schema });
  const migrationsFolder = path.resolve(__dirname, '../../../drizzle');
  migrate(db, { migrationsFolder });
  return { db, client, migrateAgain: () => migrate(db, { migrationsFolder }) };
}
