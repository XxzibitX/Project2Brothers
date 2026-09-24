-- AlterTable
ALTER TABLE `User`
  MODIFY `role` ENUM('CUSTOMER', 'MANAGER', 'OWNER') NOT NULL DEFAULT 'CUSTOMER';

-- AlterTable
ALTER TABLE `User`
  ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;

-- Promote existing demo manager to owner (if present)
UPDATE `User`
SET `role` = 'OWNER'
WHERE `phone` = '+79990000000' AND `role` = 'MANAGER';
