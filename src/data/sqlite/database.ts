import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import type { schema } from './schema';

/**
 * Base de datos que usan los repositorios. Tanto el driver de expo-sqlite (app) como el de
 * better-sqlite3 (pruebas en Node) producen una `BaseSQLiteDatabase<'sync', …>`, así que el mismo
 * código de repositorio corre en ambos entornos con las mismas migraciones.
 */
export type AppDatabase = BaseSQLiteDatabase<'sync', unknown, typeof schema>;
