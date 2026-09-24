import type { ConfigResponse, OrderSlaConfig } from "./config.dto";
import { DEFAULT_ORDER_SLA } from "./config.dto";
import { apiClient } from "./config";
import { mockDelay, USE_API_MOCK } from "./mock";

let sessionOrderSla: OrderSlaConfig = { ...DEFAULT_ORDER_SLA };

function normalizeSla(raw: unknown): OrderSlaConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_ORDER_SLA };
  const obj = raw as Record<string, unknown>;
  const green = Number(obj.greenMinutes ?? DEFAULT_ORDER_SLA.greenMinutes);
  const yellow = Number(obj.yellowMinutes ?? DEFAULT_ORDER_SLA.yellowMinutes);
  if (!Number.isFinite(green) || green < 1) return { ...DEFAULT_ORDER_SLA };
  if (!Number.isFinite(yellow) || yellow <= green) {
    return { ...DEFAULT_ORDER_SLA };
  }
  return {
    greenMinutes: Math.round(green),
    yellowMinutes: Math.round(yellow),
  };
}

/**
 * GET /v1/config
 */
export async function getConfig(): Promise<ConfigResponse> {
  if (USE_API_MOCK) {
    await mockDelay(100);
    return {
      appName: "2Brothers",
      currency: "RUB",
      orderSla: { ...sessionOrderSla },
      supportPhone: "+79991234567",
      cafeAddress: "",
      workingHours: "Ежедневно 11:00 — 23:00",
    };
  }

  const data = await apiClient.get("v1/config").json<ConfigResponse>();
  return {
    ...data,
    orderSla: normalizeSla(data.orderSla),
  };
}

/**
 * GET /v1/manager/config/order-sla
 */
export async function getManagerOrderSla(): Promise<OrderSlaConfig> {
  if (USE_API_MOCK) {
    await mockDelay(100);
    return { ...sessionOrderSla };
  }

  return apiClient
    .get("v1/manager/config/order-sla")
    .json<OrderSlaConfig>()
    .then(normalizeSla);
}

/**
 * PUT /v1/manager/config/order-sla
 */
export async function updateManagerOrderSla(
  body: OrderSlaConfig,
): Promise<OrderSlaConfig> {
  if (USE_API_MOCK) {
    await mockDelay(200);
    if (body.greenMinutes < 1 || body.yellowMinutes <= body.greenMinutes) {
      throw new Error("Жёлтый порог должен быть больше зелёного");
    }
    sessionOrderSla = {
      greenMinutes: Math.round(body.greenMinutes),
      yellowMinutes: Math.round(body.yellowMinutes),
    };
    return { ...sessionOrderSla };
  }

  return apiClient
    .put("v1/manager/config/order-sla", { json: body })
    .json<OrderSlaConfig>()
    .then(normalizeSla);
}
