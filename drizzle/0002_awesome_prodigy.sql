ALTER TABLE `applications` ADD `sale_type` text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `applications` ADD `price` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `applications` ADD `purchase_note` text DEFAULT '' NOT NULL;