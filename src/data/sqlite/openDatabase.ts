import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import type { AppDatabase } from './database';
import { schema } from './schema';

export const DATABASE_NAME = 'kapitaly-expenses.db';

/** Abre (o crea) la base local del dispositivo. Las migraciones se aplican en el layout raíz. */
export function openAppDatabase() {
  const client = openDatabaseSync(DATABASE_NAME);
  const db = drizzle(client, { schema });
  // Comprobación en tiempo de compilación: la base de expo-sqlite es una AppDatabase.
  const shared: AppDatabase = db;
  return { db, shared };
}
