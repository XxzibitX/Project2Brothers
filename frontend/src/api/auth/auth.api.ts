import { apiClient } from "@/api/config";
import { mockDelay, USE_API_MOCK } from "@/api/mock";
import type { LoginDto, RegisterDto } from "./auth.dto";
import type { AuthSession, AuthUser } from "./auth.entities";
import { mockAccounts } from "./auth.mock";

let sessionAccounts = [...mockAccounts];
/** Мок-сессия вместо cookie (только USE_API_MOCK) */
let mockSessionUser: AuthUser | null = null;

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

/**
 * GET /v1/auth/me
 * Response: AuthUser
 */
export async function getMe(): Promise<AuthUser> {
  if (USE_API_MOCK) {
    await mockDelay(150);
    if (!mockSessionUser) {
      throw new Error("Не авторизован");
    }
    return mockSessionUser;
  }

  return apiClient.get("v1/auth/me").json<AuthUser>();
}

/**
 * POST /v1/auth/login
 * Body: { phone, password }
 * Response: AuthSession (cookie выставляется бэкендом)
 */
export async function login(body: LoginDto): Promise<AuthSession> {
  if (USE_API_MOCK) {
    await mockDelay(350);
    const phone = normalizePhone(body.phone);
    const account = sessionAccounts.find(
      (a) => normalizePhone(a.phone) === phone && a.password === body.password,
    );
    if (!account) {
      throw new Error("Неверный телефон или пароль");
    }
    const { password: _password, ...user } = account;
    mockSessionUser = user;
    return { user };
  }

  return apiClient.post("v1/auth/login", { json: body }).json<AuthSession>();
}

/**
 * POST /v1/auth/register
 * Body: { phone, password, name? }
 * Response: AuthSession
 */
export async function register(body: RegisterDto): Promise<AuthSession> {
  if (USE_API_MOCK) {
    await mockDelay(400);
    const phone = normalizePhone(body.phone);
    if (sessionAccounts.some((a) => normalizePhone(a.phone) === phone)) {
      throw new Error("Пользователь с таким телефоном уже есть");
    }
    if (body.password.length < 6) {
      throw new Error("Пароль должен быть не короче 6 символов");
    }
    if (!body.personalDataConsent) {
      throw new Error("Необходимо согласие на обработку персональных данных");
    }
    const user: AuthUser = {
      id: `user-${sessionAccounts.length + 1}`,
      phone,
      name: body.name?.trim() || "Гость",
      role: "user",
    };
    sessionAccounts = [...sessionAccounts, { ...user, password: body.password }];
    mockSessionUser = user;
    return { user };
  }

  return apiClient
    .post("v1/auth/register", { json: body })
    .json<AuthSession>();
}

/**
 * POST /v1/auth/logout
 */
export async function logout(): Promise<void> {
  if (USE_API_MOCK) {
    await mockDelay(100);
    mockSessionUser = null;
    return;
  }

  await apiClient.post("v1/auth/logout").json<void>();
}
