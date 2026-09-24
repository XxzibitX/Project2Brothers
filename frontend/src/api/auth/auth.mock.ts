import type { AuthUser } from "./auth.entities";

type MockAccount = AuthUser & { password: string };

/** Демо-аккаунты */
export const mockAccounts: MockAccount[] = [
  {
    id: "user-1",
    phone: "+79991234567",
    name: "Демо",
    role: "user",
    password: "123456",
  },
  {
    id: "owner-1",
    phone: "+79990000000",
    name: "Владелец",
    role: "owner",
    password: "123456",
  },
  {
    id: "manager-1",
    phone: "+79990000001",
    name: "Менеджер",
    role: "manager",
    password: "123456",
  },
];
