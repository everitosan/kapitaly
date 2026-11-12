CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`name` text NOT NULL,
	`icon` text NOT NULL,
	`builtin` integer DEFAULT false NOT NULL,
	`hidden_at` text
);
--> statement-breakpoint
ALTER TABLE `one_off_expenses` ADD `category_id` text DEFAULT '00000000-0000-4000-8000-000000000108' NOT NULL;--> statement-breakpoint
ALTER TABLE `recurring_expenses` ADD `category_id` text DEFAULT '00000000-0000-4000-8000-000000000108' NOT NULL;--> statement-breakpoint
-- Categorías de inicio. Ids y fechas fijos: son el mismo registro en todos los dispositivos y apps de
-- la suite, así el sync no las duplica. INSERT OR IGNORE: si ya existen, no se tocan.
INSERT OR IGNORE INTO `categories` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `icon`, `builtin`, `hidden_at`) VALUES
  ('00000000-0000-4000-8000-000000000101', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', NULL, 'Hogar', 'home', 1, NULL),
  ('00000000-0000-4000-8000-000000000102', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', NULL, 'Comida', 'food', 1, NULL),
  ('00000000-0000-4000-8000-000000000103', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', NULL, 'Transporte', 'car', 1, NULL),
  ('00000000-0000-4000-8000-000000000104', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', NULL, 'Servicios', 'bolt', 1, NULL),
  ('00000000-0000-4000-8000-000000000105', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', NULL, 'Suscripciones', 'repeat', 1, NULL),
  ('00000000-0000-4000-8000-000000000106', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', NULL, 'Salud', 'health', 1, NULL),
  ('00000000-0000-4000-8000-000000000107', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', NULL, 'Entretenimiento', 'ticket', 1, NULL),
  ('00000000-0000-4000-8000-000000000108', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', NULL, 'Otro', 'dots', 1, NULL);
