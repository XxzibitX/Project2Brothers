import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type {
  AuthUserPayload,
  UserRole,
} from '../common/current-user.decorator';

type JwtPayload = {
  sub: string;
  phone: string;
  name: string;
  role: UserRole | 'CUSTOMER' | 'MANAGER' | 'OWNER';
};

type RequestWithUser = Request & { user?: AuthUserPayload };

function normalizeRole(role: JwtPayload['role']): UserRole {
  if (role === 'owner' || role === 'OWNER') return 'owner';
  if (role === 'manager' || role === 'MANAGER') return 'manager';
  return 'user';
}

function attachUser(request: RequestWithUser, payload: JwtPayload) {
  request.user = {
    id: payload.sub,
    phone: payload.phone,
    name: payload.name,
    role: normalizeRole(payload.role),
  };
}

function extractToken(
  request: Request,
  cookieName: string,
): string | undefined {
  const cookieToken = request.cookies?.[cookieName] as string | undefined;
  if (cookieToken) return cookieToken;

  const header = request.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return undefined;
}

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const cookieName = this.config.get<string>('COOKIE_NAME') ?? 'access_token';
    const token = extractToken(request, cookieName);
    if (!token) {
      return true;
    }

    try {
      const payload = this.jwt.verify<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
      attachUser(request, payload);
    } catch {
      // optional: ignore invalid token
    }
    return true;
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const cookieName = this.config.get<string>('COOKIE_NAME') ?? 'access_token';
    const token = extractToken(request, cookieName);
    if (!token) {
      throw new UnauthorizedException('Требуется авторизация');
    }

    try {
      const payload = this.jwt.verify<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
      attachUser(request, payload);
      return true;
    } catch {
      throw new UnauthorizedException('Сессия недействительна');
    }
  }
}
