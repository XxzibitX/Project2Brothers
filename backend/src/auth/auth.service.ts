import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto, LoginDto, RegisterDto } from '../common/dto';
import { mapAuthUser, normalizePhone, toApiRole } from '../common/mappers';
import type { User } from '@prisma/client';
import { LegalService } from '../legal/legal.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly legalService: LegalService,
  ) {}

  async login(dto: LoginDto) {
    const phone = normalizePhone(dto.phone);
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Неверный телефон или пароль');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Аккаунт отключён');
    }
    return this.buildSession(user);
  }

  async register(
    dto: RegisterDto,
    meta?: { ipAddress?: string | null; userAgent?: string | null },
  ) {
    if (dto.personalDataConsent !== true) {
      throw new BadRequestException(
        'Необходимо согласие на обработку персональных данных',
      );
    }

    const published = await this.legalService.getPublishedPrivacyVersion();
    if (!published) {
      throw new BadRequestException(
        'Регистрация временно недоступна: политика обработки персональных данных ещё не опубликована',
      );
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
        name: dto.name?.trim() || 'Гость',
        passwordHash,
        role: 'CUSTOMER',
      },
    });

    try {
      await this.legalService.recordPersonalDataConsent({
        userId: user.id,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      });
    } catch (err) {
      await this.prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
      throw err;
    }

    return this.buildSession(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    return mapAuthUser(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    if (!(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new BadRequestException('Неверный текущий пароль');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Новый пароль совпадает с текущим');
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    return { ok: true };
  }

  setAuthCookie(res: Response, token: string) {
    const cookieName = this.config.get<string>('COOKIE_NAME') ?? 'access_token';
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    res.cookie(cookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  clearAuthCookie(res: Response) {
    const cookieName = this.config.get<string>('COOKIE_NAME') ?? 'access_token';
    res.clearCookie(cookieName, { path: '/' });
  }

  private async buildSession(user: User) {
    const token = await this.jwt.signAsync({
      sub: user.id,
      phone: user.phone,
      name: user.name,
      role: toApiRole(user.role),
    });
    return {
      user: mapAuthUser(user),
      token,
    };
  }
}
