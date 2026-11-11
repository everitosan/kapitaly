CREATE TABLE `card_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`payment_method_id` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`date` text NOT NULL,
	`for_due_date` text
);
--> statement-breakpoint
CREATE TABLE `recurring_charge_confirmations` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`recurring_expense_id` text NOT NULL,
	`occurrence_date` text NOT NULL,
	`status` text NOT NULL,
	`amount_cents` integer,
	`payment_method_id` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `payment_methods` ADD `opening_balance_cents` integer;--> statement-breakpoint
ALTER TABLE `payment_methods` ADD `opening_balance_date` text;--> statement-breakpoint
ALTER TABLE `payment_methods` ADD `credit_limit_cents` integer;--> statement-breakpoint
ALTER TABLE `payment_methods` ADD `payment_due_day` integer;