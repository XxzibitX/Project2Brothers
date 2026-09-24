-- AlterTable
ALTER TABLE `Order` ADD COLUMN `telegramChatId` VARCHAR(191) NULL,
    ADD COLUMN `telegramMessageId` INTEGER NULL;
