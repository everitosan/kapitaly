CREATE TABLE `reminder_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`charges_on` integer DEFAULT false NOT NULL,
	`charges_time` text DEFAULT '10:00' NOT NULL,
	`daily_on` integer DEFAULT false NOT NULL,
	`daily_time` text DEFAULT '21:00' NOT NULL,
	`idle_on` integer DEFAULT false NOT NULL,
	`idle_days` integer DEFAULT 3 NOT NULL,
	`idle_time` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
-- Fila única de preferencias, con todo apagado. INSERT OR IGNORE: si ya existe, no se toca.
INSERT OR IGNORE INTO `reminder_settings` (`id`, `updated_at`) VALUES ('default', '2026-01-01T00:00:00.000Z');
