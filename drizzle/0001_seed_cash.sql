-- Método inicial "Efectivo". Id y fechas fijos: es el mismo registro en todos los dispositivos,
-- así el sync de la v2 no lo duplica. INSERT OR IGNORE: si ya existe (aunque esté eliminado), no se toca.
INSERT OR IGNORE INTO `payment_methods`
  (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `kind`, `institution_id`, `last4`, `color`, `archived_at`)
VALUES
  ('00000000-0000-4000-8000-000000000001', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', NULL, 'Efectivo', 'cash', NULL, NULL, 'mint', NULL);
