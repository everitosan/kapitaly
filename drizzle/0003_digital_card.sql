ALTER TABLE `one_off_expenses` ADD `card_variant` text;--> statement-breakpoint
ALTER TABLE `payment_methods` ADD `has_digital` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `payment_methods` ADD `digital_last4` text;--> statement-breakpoint
ALTER TABLE `recurring_expenses` ADD `card_variant` text;