-- AlterTable
ALTER TABLE `Order`
  ADD COLUMN `idempotencyKey` VARCHAR(191) NULL,
  ADD COLUMN `telegramNotifiedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Order_idempotencyKey_key` ON `Order`(`idempotencyKey`);

-- CreateIndex
CREATE INDEX `Order_telegramNotifiedAt_idx` ON `Order`(`telegramNotifiedAt`);

-- CreateTable
CREATE TABLE `OrderCounter` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `value` INTEGER NOT NULL DEFAULT 1000,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed counter from existing ORD-* ids (or 1000)
INSERT INTO `OrderCounter` (`id`, `value`)
SELECT 1, GREATEST(
  1000,
  COALESCE((
    SELECT MAX(CAST(SUBSTRING(`id`, 5) AS UNSIGNED))
    FROM `Order`
    WHERE `id` REGEXP '^ORD-[0-9]+$'
  ), 1000)
);
