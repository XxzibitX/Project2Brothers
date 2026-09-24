import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/** API-роль: user (клиент) | manager | owner */
export type UserRole = 'user' | 'manager' | 'owner';

export type AuthUserPayload = {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
};

type RequestWithUser = Request & { user?: AuthUserPayload };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUserPayload | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
