CREATE TABLE `zone_plants` (
	`zone_id` text NOT NULL,
	`plant_slug` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`zone_id`, `plant_slug`)
);
