import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return base || `cat-${Date.now().toString(36)}`;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const items = await this.prisma.menuCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return {
      items: items.map((c) => ({
        id: c.id,
        key: c.key,
        name: c.name,
        sortOrder: c.sortOrder,
      })),
    };
  }

  async create(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new BadRequestException('Укажите название категории');
    }

    let key = slugify(trimmed);
    const exists = await this.prisma.menuCategory.findUnique({ where: { key } });
    if (exists) {
      key = `${key}-${Date.now().toString(36)}`;
    }

    const maxSort = await this.prisma.menuCategory.aggregate({
      _max: { sortOrder: true },
    });

    const category = await this.prisma.menuCategory.create({
      data: {
        key,
        name: trimmed,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    });

    return {
      id: category.id,
      key: category.key,
      name: category.name,
      sortOrder: category.sortOrder,
    };
  }

  async remove(key: string) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { key },
    });
    if (!category) {
      throw new NotFoundException('Категория не найдена');
    }

    const productsCount = await this.prisma.product.count({
      where: { category: key },
    });
    if (productsCount > 0) {
      throw new BadRequestException(
        `Нельзя удалить: в категории ${productsCount} товар(ов). Сначала перенесите или удалите их.`,
      );
    }

    await this.prisma.menuCategory.delete({ where: { key } });
    return { ok: true };
  }

  async assertExists(key: string) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { key },
    });
    if (!category) {
      throw new BadRequestException('Категория не найдена');
    }
    return category;
  }
}
