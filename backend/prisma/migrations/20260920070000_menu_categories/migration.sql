-- CreateTable
CREATE TABLE `MenuCategory` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MenuCategory_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed default categories
INSERT INTO `MenuCategory` (`id`, `key`, `name`, `sortOrder`, `createdAt`, `updatedAt`) VALUES
('cat-shawarma', 'shawarma', 'Шаурма', 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('cat-sides', 'sides', 'Гарниры', 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('cat-drinks', 'drinks', 'Напитки', 2, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('cat-sauces', 'sauces', 'Соусы', 3, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

-- AlterTable: category enum → string
ALTER TABLE `Product` MODIFY `category` VARCHAR(191) NOT NULL;

CREATE INDEX `Product_category_idx` ON `Product`(`category`);
