import { apiClient } from "@/api/config";
import type { UserRole } from "@/api/auth/auth.entities";

export type StaffMember = {
  id: string;
  phone: string;
  name: string;
  role: Extract<UserRole, "manager" | "owner">;
  isActive: boolean;
  createdAt: string;
};

export type ManagerSettings = {
  cafe: {
    supportPhone: string;
    cafeAddress: string;
    workingHours: string;
  };
  telegram: {
    botTokenMasked: string;
    chatIds: string;
    configured: boolean;
    hasToken: boolean;
  };
  orderSla: {
    greenMinutes: number;
    yellowMinutes: number;
  };
};

export type ManagerSystemStatus = {
  api: true;
  db: boolean;
  telegram: {
    ok: boolean;
    configured: boolean;
    message: string;
    botUsername: string | null;
    polling: boolean;
  };
  pendingTelegramOrders: number;
  checkedAt: string;
};

export async function changePassword(body: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: boolean }> {
  return apiClient.post("v1/auth/change-password", { json: body }).json();
}

export async function getManagerSettings(): Promise<ManagerSettings> {
  return apiClient.get("v1/manager/settings").json();
}

export async function getManagerSystemStatus(): Promise<ManagerSystemStatus> {
  return apiClient.get("v1/manager/system-status").json();
}

export async function updateCafeSettings(body: {
  supportPhone?: string;
  cafeAddress?: string;
  workingHours?: string;
}) {
  return apiClient.put("v1/manager/settings/cafe", { json: body }).json<{
    supportPhone: string;
    cafeAddress: string;
    workingHours: string;
  }>();
}

export async function updateTelegramSettings(body: {
  botToken?: string;
  chatIds?: string;
}) {
  return apiClient.put("v1/manager/settings/telegram", { json: body }).json<{
    botTokenMasked: string;
    chatIds: string;
    configured: boolean;
  }>();
}

export async function testTelegramSettings(): Promise<{
  ok: boolean;
  message: string;
}> {
  return apiClient.post("v1/manager/settings/telegram/test").json();
}

export async function getStaff(): Promise<{ items: StaffMember[] }> {
  return apiClient.get("v1/manager/staff").json();
}

export async function createStaff(body: {
  phone: string;
  name: string;
  password: string;
  role: "manager" | "owner";
}): Promise<StaffMember> {
  return apiClient.post("v1/manager/staff", { json: body }).json();
}

export async function patchStaff(
  id: string,
  body: {
    name?: string;
    role?: "manager" | "owner";
    isActive?: boolean;
    newPassword?: string;
  },
): Promise<StaffMember> {
  return apiClient
    .patch(`v1/manager/staff/${encodeURIComponent(id)}`, { json: body })
    .json();
}
