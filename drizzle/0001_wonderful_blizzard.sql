CREATE TABLE `cinema_source_ingestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` varchar(96) NOT NULL,
	`sourceName` varchar(255) NOT NULL,
	`sourceType` varchar(32) NOT NULL,
	`rightsStatus` varchar(32) NOT NULL,
	`storageKey` varchar(512),
	`storageUrl` varchar(512),
	`sizeBytes` int,
	`status` enum('selected','uploaded','ready_for_analysis','analysed','failed') NOT NULL DEFAULT 'selected',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cinema_source_ingestions_id` PRIMARY KEY(`id`),
	CONSTRAINT `cinema_source_ingestions_user_project_unique` UNIQUE(`userId`,`projectId`)
);
