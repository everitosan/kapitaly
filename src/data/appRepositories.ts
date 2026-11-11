import { randomUUID } from 'expo-crypto';

import { createSqliteRepositories } from './repositories/sqlite';
import { defaultNow } from './repositories/shared';
import type { Repositories } from './repositories/types';
import { getAppDatabase } from './sqlite/appDatabase';

let repositories: Repositories | null = null;

/** Repositorios de la app sobre la base SQLite local. Llamar después de aplicar las migraciones. */
export function getAppRepositories(): Repositories {
  if (!repositories) {
    repositories = createSqliteRepositories(getAppDatabase().shared, {
      now: defaultNow,
      newId: randomUUID,
    });
  }
  return repositories;
}
