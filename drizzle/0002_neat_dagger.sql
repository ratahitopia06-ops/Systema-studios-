CREATE TABLE `cinema_custom_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` varchar(96) NOT NULL,
	`templateId` varchar(128) NOT NULL,
	`name` varchar(160) NOT NULL,
	`templateJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cinema_custom_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `cinema_custom_templates_user_project_template_unique` UNIQUE(`userId`,`projectId`,`templateId`)
);
