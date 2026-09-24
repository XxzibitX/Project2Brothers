export type UserRole = "user" | "manager" | "owner";

export interface AuthUser {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
}

/** Ответ login/register — сессия в httpOnly cookie, токен в теле опционален */
export interface AuthSession {
  user: AuthUser;
  token?: string;
}
