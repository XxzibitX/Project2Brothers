import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertProductDto } from '../common/dto';
import { mapProduct } from '../common/mappers';
import { CategoriesService } from '../categories/categories.service';
import { UploadsService } from '../uploads/uploads.service';

function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return base || `product-${Date.now()}`;
}

function autoKey(name: string): string {
  const slug = slugify(name);
  return `${slug || 'item'}-${Math.random().toString(36).slice(2, 8)}`;
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoriesService: CategoriesService,
    private readonly uploadsService: UploadsService,
  ) {}

  async findAll(category?: string) {
    const products = await this.prisma.product.findMany({
      where: category ? { category } : undefined,
      include: { ingredients: true, extras: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    return { items: products.map(mapProduct) };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { ingredients: true, extras: true },
    });
    if (!product) {
      throw new NotFoundException('Товар не найден');
    }
    return mapProduct(product);
  }

  async create(dto: UpsertProductDto) {
    await this.categoriesService.assertExists(dto.category);
    const id = await this.resolveNewId(dto.id, dto.name);
    const product = await this.prisma.product.create({
      data: {
        id,
        name: dto.name.trim(),
        description: dto.description,
        price: dto.price,
        weight: dto.weight,
        category: dto.category,
        image: dto.image,
        popular: Boolean(dto.popular),
        ingredients: {
          create: (dto.ingredients ?? []).map((i) => ({
            key: i.id?.trim() || autoKey(i.name),
            name: i.name.trim(),
          })),
        },
        extras: {
          create: (dto.extras ?? []).map((e) => ({
            key: e.id?.trim() || autoKey(e.name),
            name: e.name.trim(),
            price: e.price,
          })),
        },
      },
      include: { ingredients: true, extras: true },
    });
    return mapProduct(product);
  }

  async update(id: string, dto: UpsertProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Товар не найден');
    }
    await this.categoriesService.assertExists(dto.category);

    const product = await this.prisma.$transaction(async (tx) => {
      await tx.productIngredient.deleteMany({ where: { productId: id } });
      await tx.productExtra.deleteMany({ where: { productId: id } });

      return tx.product.update({
        where: { id },
        data: {
          name: dto.name.trim(),
          description: dto.description,
          price: dto.price,
          weight: dto.weight,
          category: dto.category,
          image: dto.image,
          popular: Boolean(dto.popular),
          ingredients: {
            create: (dto.ingredients ?? []).map((i) => ({
              key: i.id?.trim() || autoKey(i.name),
              name: i.name.trim(),
            })),
          },
          extras: {
            create: (dto.extras ?? []).map((e) => ({
              key: e.id?.trim() || autoKey(e.name),
              name: e.name.trim(),
              price: e.price,
            })),
          },
        },
        include: { ingredients: true, extras: true },
      });
    });

    if (existing.image && existing.image !== dto.image) {
      await this.deleteImageIfUnused(existing.image);
    }

    return mapProduct(product);
  }

  async remove(id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Товар не найден');
    }

    const activeUsages = await this.prisma.orderItem.count({
      where: {
        productId: id,
        order: {
          status: { notIn: ['done', 'cancelled'] },
        },
      },
    });

    if (activeUsages > 0) {
      throw new BadRequestException(
        'Нельзя удалить товар: он есть в активных заказах. Дождитесь выдачи или отмените эти заказы.',
      );
    }

    // В выданных/отменённых заказах снимок названия уже сохранён — отвязываем FK
    await this.prisma.$transaction([
      this.prisma.orderItem.updateMany({
        where: { productId: id },
        data: { productId: null },
      }),
      this.prisma.product.delete({ where: { id } }),
    ]);

    await this.deleteImageIfUnused(existing.image);

    return { ok: true };
  }

  /** Удаляет файл с диска, если URL больше ни у кого не используется. */
  private async deleteImageIfUnused(imageUrl: string | null | undefined) {
    if (!imageUrl) return;
    const stillUsed = await this.prisma.product.count({
      where: { image: imageUrl },
    });
    if (stillUsed > 0) return;
    await this.uploadsService.deleteLocalProductImage(imageUrl);
  }

  private async resolveNewId(preferred: string | undefined, name: string) {
    const base = (preferred?.trim() || slugify(name)).slice(0, 48);
    const exists = await this.prisma.product.findUnique({
      where: { id: base },
    });
    if (!exists) return base;
    return `${base}-${Date.now().toString(36)}`;
  }
}
