-- AlterTable
ALTER TABLE `Order` ADD COLUMN `paymentMethod` ENUM('card_courier', 'cash_courier') NOT NULL DEFAULT 'cash_courier';
