import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toNumber } from '../common/mappers';

function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return base || `extra-${Date.now().toString(36)}`;
}

function mapExtra(extra: {
  id: string;
  key: string;
  name: string;
  price: { toString(): string } | number;
}) {
  return {
    id: extra.key,
    key: extra.key,
    name: extra.name,
    price: toNumber(extra.price as never),
  };
}

@Injectable()
export class ExtrasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const items = await this.prisma.menuExtra.findMany({
      orderBy: { name: 'asc' },
    });
    return { items: items.map(mapExtra) };
  }

  async create(name: string, price: number) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new BadRequestException('Укажите название допа');
    }
    if (Number.isNaN(price) || price < 0) {
      throw new BadRequestException('Укажите корректную цену');
    }

    let key = slugify(trimmed);
    const exists = await this.prisma.menuExtra.findUnique({ where: { key } });
    if (exists) {
      key = `${key}-${Date.now().toString(36)}`;
    }

    const extra = await this.prisma.menuExtra.create({
      data: { key, name: trimmed, price },
    });
    return mapExtra(extra);
  }

  async update(key: string, name: string, price: number) {
    const existing = await this.prisma.menuExtra.findUnique({ where: { key } });
    if (!existing) {
      throw new NotFoundException('Доп не найден');
    }
    const trimmed = name.trim();
    if (!trimmed) {
      throw new BadRequestException('Укажите название допа');
    }
    if (Number.isNaN(price) || price < 0) {
      throw new BadRequestException('Укажите корректную цену');
    }

    const extra = await this.prisma.menuExtra.update({
      where: { key },
      data: { name: trimmed, price },
    });

    // Синхронизируем название/цену на товарах с этим ключом
    await this.prisma.productExtra.updateMany({
      where: { key },
      data: { name: trimmed, price },
    });

    return mapExtra(extra);
  }

  async remove(key: string) {
    const existing = await this.prisma.menuExtra.findUnique({ where: { key } });
    if (!existing) {
      throw new NotFoundException('Доп не найден');
    }

    await this.prisma.$transaction([
      this.prisma.productExtra.deleteMany({ where: { key } }),
      this.prisma.menuExtra.delete({ where: { key } }),
    ]);

    return { ok: true };
  }
}
