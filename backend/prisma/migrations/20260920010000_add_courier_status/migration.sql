-- AlterEnum
ALTER TABLE `Order` MODIFY `status` ENUM('new', 'cooking', 'ready', 'courier', 'done', 'cancelled') NOT NULL DEFAULT 'new';
