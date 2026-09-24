-- CreateTable
CREATE TABLE `LegalDocument` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('PRIVACY', 'OFFER', 'DELIVERY_INFO') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `draftContent` LONGTEXT NOT NULL,
    `draftUpdatedAt` DATETIME(3) NULL,
    `publishedVersion` VARCHAR(191) NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LegalDocument_type_key`(`type`),
    UNIQUE INDEX `LegalDocument_slug_key`(`slug`),
    INDEX `LegalDocument_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LegalDocumentVersion` (
    `id` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `publishedAt` DATETIME(3) NOT NULL,

    INDEX `LegalDocumentVersion_documentId_idx`(`documentId`),
    UNIQUE INDEX `LegalDocumentVersion_documentId_version_key`(`documentId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Consent` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('PERSONAL_DATA') NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `documentVersionId` VARCHAR(191) NOT NULL,
    `documentVersion` VARCHAR(191) NOT NULL,
    `acceptedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,

    INDEX `Consent_userId_idx`(`userId`),
    INDEX `Consent_documentId_idx`(`documentId`),
    INDEX `Consent_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LegalDocumentVersion` ADD CONSTRAINT `LegalDocumentVersion_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `LegalDocument`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LegalDocumentVersion` ADD CONSTRAINT `LegalDocumentVersion_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Consent` ADD CONSTRAINT `Consent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Consent` ADD CONSTRAINT `Consent_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `LegalDocument`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Consent` ADD CONSTRAINT `Consent_documentVersionId_fkey` FOREIGN KEY (`documentVersionId`) REFERENCES `LegalDocumentVersion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
