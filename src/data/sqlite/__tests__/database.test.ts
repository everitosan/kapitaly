import fs from 'node:fs';
import path from 'node:path';

import { eq } from 'drizzle-orm';

import { CASH_METHOD_ID } from '@/domain/paymentMethod';

import { paymentMethods } from '../schema';
import { createTestDatabase } from '../testDatabase';

describe('base SQLite compartida (prueba de concepto)', () => {
  it('aplica las migraciones y consulta con Drizzle', () => {
    const { db } = createTestDatabase();
    const rows = db.select().from(paymentMethods).all();
    expect(rows).toEqual([
      expect.objectContaining({
        id: CASH_METHOD_ID,
        name: 'Efectivo',
        kind: 'cash',
        color: 'mint',
        deletedAt: null,
      }),
    ]);
  });

  it('volver a migrar (reabrir la app) no duplica "Efectivo"', () => {
    const { db, migrateAgain } = createTestDatabase();
    migrateAgain();
    migrateAgain();
    expect(
      db.select().from(paymentMethods).where(eq(paymentMethods.id, CASH_METHOD_ID)).all(),
    ).toHaveLength(1);
  });

  it('el seed no revive un "Efectivo" eliminado', () => {
    const { db, client } = createTestDatabase();
    db.update(paymentMethods)
      .set({ deletedAt: '2026-11-01T00:00:00.000Z' })
      .where(eq(paymentMethods.id, CASH_METHOD_ID))
      .run();
    // Simula una base nueva aplicando de nuevo solo el seed: INSERT OR IGNORE respeta la fila existente.
    client.exec(
      fs.readFileSync(path.resolve(__dirname, '../../../../drizzle/0001_seed_cash.sql'), 'utf8'),
    );
    expect(db.select().from(paymentMethods).all()[0].deletedAt).toBe('2026-11-01T00:00:00.000Z');
  });
});
