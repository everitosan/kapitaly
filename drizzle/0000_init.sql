CREATE TABLE `one_off_expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`description` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`date` text NOT NULL,
	`payment_method_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payment_methods` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`institution_id` text,
	`last4` text,
	`color` text,
	`archived_at` text
);
--> statement-breakpoint
CREATE TABLE `recurring_expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`name` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`interval_unit` text NOT NULL,
	`interval_count` integer NOT NULL,
	`anchor_date` text NOT NULL,
	`end_date` text,
	`payment_method_id` text NOT NULL
);
