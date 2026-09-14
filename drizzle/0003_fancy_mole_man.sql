CREATE TABLE `software_downloads` (
	`id` text PRIMARY KEY NOT NULL,
	`software_id` text NOT NULL,
	`version` text DEFAULT '' NOT NULL,
	`file_name` text DEFAULT '' NOT NULL,
	`downloaded_at` integer NOT NULL,
	`ip_hash` text,
	`user_agent` text,
	`country` text
);
CREATE INDEX `idx_software_downloads_software_id` ON `software_downloads` (`software_id`);
CREATE INDEX `idx_software_downloads_downloaded_at` ON `software_downloads` (`downloaded_at`);
CREATE INDEX `idx_software_downloads_software_date` ON `software_downloads` (`software_id`,`downloaded_at`);
