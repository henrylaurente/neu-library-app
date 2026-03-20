CREATE TABLE `visitorLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` datetime NOT NULL,
	`reason` varchar(255) NOT NULL,
	`college` varchar(255) NOT NULL,
	`employeeType` enum('teacher','staff','non-employee') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `visitorLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `loginMethod` varchar(64) DEFAULT 'google';--> statement-breakpoint
ALTER TABLE `users` ADD `googleId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `currentRole` enum('user','admin') DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_googleId_unique` UNIQUE(`googleId`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);