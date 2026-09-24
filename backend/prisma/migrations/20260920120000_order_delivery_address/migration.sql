-- AlterTable
ALTER TABLE `Order`
  ADD COLUMN `deliveryAddress` TEXT NULL,
  ADD COLUMN `deliveryStreet` VARCHAR(191) NULL,
  ADD COLUMN `deliveryHouse` VARCHAR(191) NULL,
  ADD COLUMN `deliveryEntrance` VARCHAR(191) NULL,
  ADD COLUMN `deliveryApartment` VARCHAR(191) NULL,
  ADD COLUMN `deliveryIsPrivateHouse` BOOLEAN NOT NULL DEFAULT false;
