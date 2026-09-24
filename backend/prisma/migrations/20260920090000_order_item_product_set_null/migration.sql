-- Allow deleting products that only appear in finished orders
ALTER TABLE `OrderItem` DROP FOREIGN KEY `OrderItem_productId_fkey`;

ALTER TABLE `OrderItem` MODIFY `productId` VARCHAR(191) NULL;

ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
