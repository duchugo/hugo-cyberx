CREATE TABLE `site_owner` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `site_owner_user_id_unique` ON `site_owner` (`user_id`);--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`bank_name` text DEFAULT '' NOT NULL,
	`account_number` text DEFAULT '' NOT NULL,
	`account_name` text DEFAULT '' NOT NULL,
	`qr_object_key` text,
	`thank_you_text` text DEFAULT 'Cảm ơn bạn đã đồng hành cùng Hugo Cyberx!' NOT NULL
);
