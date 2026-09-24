import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto, PatchStaffDto } from '../common/dto';
import { mapAuthUser, normalizePhone } from '../common/mappers';
import type { AuthUserPayload } from '../common/current-user.decorator';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const users = await this.prisma.user.findMany({
      where: { role: { in: ['MANAGER', 'OWNER'] } },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });
    return {
      items: users.map((u) => ({
        ...mapAuthUser(u),
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
      })),
    };
  }

  async create(dto: CreateStaffDto, actor: AuthUserPayload) {
    if (actor.role !== 'owner') {
      throw new ForbiddenException('Только владелец может добавлять сотрудников');
    }
    if (dto.role === 'owner' && actor.role !== 'owner') {
      throw new ForbiddenException('Нельзя назначить владельца');
    }

    const phone = normalizePhone(dto.phone);
    const existing = await this.prisma.user.findUnique({ where: { phone } });
    if (existing) {
      throw new ConflictException('Пользователь с таким телефоном уже есть');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        phone,
        name: dto.name.trim(),
        passwordHash,
        role: dto.role === 'owner' ? 'OWNER' : 'MANAGER',
        isActive: true,
      },
    });

    return {
      ...mapAuthUser(user),
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async patch(id: string, dto: PatchStaffDto, actor: AuthUserPayload) {
    if (actor.role !== 'owner') {
      throw new ForbiddenException('Только владелец может менять сотрудников');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || (user.role !== 'MANAGER' && user.role !== 'OWNER')) {
      throw new NotFoundException('Сотрудник не найден');
    }

    if (user.id === actor.id && dto.isActive === false) {
      throw new BadRequestException('Нельзя отключить свой аккаунт');
    }

    if (
      user.role === 'OWNER' &&
      dto.role === 'manager' &&
      user.id === actor.id
    ) {
      const owners = await this.prisma.user.count({
        where: { role: 'OWNER', isActive: true },
      });
      if (owners <= 1) {
        throw new BadRequestException(
          'Нельзя снять роль с единственного владельца',
        );
      }
    }

    const data: {
      name?: string;
      role?: 'MANAGER' | 'OWNER';
      isActive?: boolean;
      passwordHash?: string;
    } = {};

    if (dto.name?.trim()) data.name = dto.name.trim();
    if (dto.role) data.role = dto.role === 'owner' ? 'OWNER' : 'MANAGER';
    if (dto.isActive != null) data.isActive = dto.isActive;
    if (dto.newPassword) {
      data.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    }

    if (!Object.keys(data).length) {
      throw new BadRequestException('Нечего обновлять');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });

    return {
      ...mapAuthUser(updated),
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
    };
  }
}
