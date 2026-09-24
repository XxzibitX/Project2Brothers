import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { unlink, writeFile } from 'fs/promises';
import { basename, extname, join, resolve } from 'path';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { memoryStorage } from 'multer';
import sharp from 'sharp';

export const UPLOADS_ROOT = join(process.cwd(), 'uploads');
export const PRODUCTS_UPLOAD_DIR = join(UPLOADS_ROOT, 'products');

const PRODUCT_IMAGE_URL_PREFIX = '/api/uploads/products/';

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

/** Макс. ширина карточки каталога (без апскейла) */
const MAX_IMAGE_WIDTH = 1200;
const WEBP_QUALITY = 80;

export function ensureUploadDirs() {
  mkdirSync(PRODUCTS_UPLOAD_DIR, { recursive: true });
}

/** Публичный URL (через Vite/nginx proxy /api → backend) */
export function productImagePublicUrl(filename: string): string {
  return `${PRODUCT_IMAGE_URL_PREFIX}${filename}`;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor() {
    ensureUploadDirs();
  }

  /**
   * Удаляет локальный файл товара по публичному URL.
   * Внешние URL и чужие пути игнорируются. ENOENT — ок.
   */
  async deleteLocalProductImage(publicUrl?: string | null): Promise<void> {
    if (!publicUrl || !publicUrl.startsWith(PRODUCT_IMAGE_URL_PREFIX)) {
      return;
    }

    const rawName = publicUrl.slice(PRODUCT_IMAGE_URL_PREFIX.length);
    const filename = basename(rawName);
    if (!filename || filename !== rawName || filename.includes('..')) {
      return;
    }

    const dest = resolve(PRODUCTS_UPLOAD_DIR, filename);
    const root = resolve(PRODUCTS_UPLOAD_DIR);
    if (!dest.startsWith(root + '/') && dest !== root) {
      return;
    }

    try {
      await unlink(dest);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code !== 'ENOENT') {
        this.logger.warn(`Не удалось удалить изображение ${filename}: ${code}`);
      }
    }
  }

  assertImageFile(file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Выберите файл изображения');
    }
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        'Допустимы только изображения: JPG, PNG, WEBP, GIF',
      );
    }
    if (!file.buffer?.length) {
      throw new BadRequestException('Пустой файл изображения');
    }
  }

  /**
   * Ресайз + WebP → диск. Возвращает публичный url.
   */
  async processAndSaveProductImage(
    file: Express.Multer.File,
  ): Promise<{ url: string }> {
    this.assertImageFile(file);
    ensureUploadDirs();

    const filename = `${randomUUID()}.webp`;
    const dest = join(PRODUCTS_UPLOAD_DIR, filename);

    try {
      const buffer = await sharp(file.buffer)
        .rotate()
        .resize({
          width: MAX_IMAGE_WIDTH,
          withoutEnlargement: true,
          fit: 'inside',
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();

      await writeFile(dest, buffer);
    } catch {
      throw new InternalServerErrorException(
        'Не удалось обработать изображение',
      );
    }

    return { url: productImagePublicUrl(filename) };
  }
}

export const productImageMulterOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const ext = extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_MIME.has(file.mimetype) || (ext && !ALLOWED_EXT.has(ext))) {
      cb(new Error('Допустимы только изображения: JPG, PNG, WEBP, GIF'), false);
      return;
    }
    cb(null, true);
  },
};
