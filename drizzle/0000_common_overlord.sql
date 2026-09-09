CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`platform` text NOT NULL,
	`version` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`category` text NOT NULL,
	`color` text NOT NULL,
	`object_key` text NOT NULL,
	`downloads` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`uploader_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `applications_object_key_unique` ON `applications` (`object_key`);