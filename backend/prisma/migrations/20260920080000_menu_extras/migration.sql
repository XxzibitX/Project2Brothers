-- CreateTable
CREATE TABLE `MenuExtra` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MenuExtra_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed from existing product extras (unique by key)
INSERT INTO `MenuExtra` (`id`, `key`, `name`, `price`, `createdAt`, `updatedAt`)
SELECT
  CONCAT('mex-', `key`) AS `id`,
  `key`,
  MIN(`name`) AS `name`,
  MIN(`price`) AS `price`,
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `ProductExtra`
GROUP BY `key`;
