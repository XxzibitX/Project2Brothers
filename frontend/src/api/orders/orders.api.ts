import { apiClient } from "@/api/config";
import { mockDelay, USE_API_MOCK } from "@/api/mock";
import { getMockCatalog } from "@/api/products/products.api";
import type {
  ArchiveMonthsResponse,
  ArchiveOrdersQuery,
  CreateOrderDto,
  CreateOrderResponse,
  OrdersListResponse,
  OrdersQuery,
  PatchOrderStatusDto,
} from "./orders.dto";
import type { Order } from "./orders.entities";
import { mockOrders } from "./orders.mock";

/** Мутабельная копия для мок-сессии (смена статусов / создание) */
let sessionOrders: Order[] = structuredClone(mockOrders);

const ACTIVE_STATUSES = new Set(["new", "cooking", "ready", "courier"]);
const COMPLETED_STATUSES = new Set(["done", "cancelled"]);

function toSearchParams(query: OrdersQuery = {}) {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.bucket) params.set("bucket", query.bucket);
  if (query.page != null) params.set("page", String(query.page));
  if (query.limit != null) params.set("limit", String(query.limit));
  return params;
}

function filterManagerMock(items: Order[], query: OrdersQuery): Order[] {
  let next = items.filter((o) => !o.archivedAt);
  if (query.bucket === "active") {
    next = next.filter((o) => ACTIVE_STATUSES.has(o.status));
  } else if (query.bucket === "completed") {
    next = next.filter((o) => COMPLETED_STATUSES.has(o.status));
  }
  if (query.status) {
    next = next.filter((o) => o.status === query.status);
  }
  return next;
}

function paginateOrders(items: Order[], query: OrdersQuery): OrdersListResponse {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(50, Math.max(1, query.limit ?? 10));
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    total: items.length,
    page,
    limit,
  };
}

/**
 * GET /v1/orders — свои заказы (auth)
 */
export async function getMyOrders(
  query: OrdersQuery = {},
): Promise<OrdersListResponse> {
  if (USE_API_MOCK) {
    await mockDelay();
    let items = [...sessionOrders];
    if (query.status) {
      items = items.filter((o) => o.status === query.status);
    }
    return paginateOrders(items, query);
  }

  return apiClient
    .get("v1/orders", { searchParams: toSearchParams(query) })
    .json<OrdersListResponse>();
}

/**
 * GET /v1/manager/orders — рабочие заказы (без архива)
 */
export async function getManagerOrders(
  query: OrdersQuery = {},
): Promise<OrdersListResponse> {
  if (USE_API_MOCK) {
    await mockDelay();
    return paginateOrders(filterManagerMock(sessionOrders, query), query);
  }

  return apiClient
    .get("v1/manager/orders", { searchParams: toSearchParams(query) })
    .json<OrdersListResponse>();
}

/**
 * GET /v1/manager/orders/archive/months
 */
export async function getManagerArchiveMonths(): Promise<ArchiveMonthsResponse> {
  if (USE_API_MOCK) {
    await mockDelay();
    const counts = new Map<string, number>();
    for (const o of sessionOrders) {
      if (!o.archivedAt) continue;
      const d = new Date(o.createdAt);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return {
      items: [...counts.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([yearMonth, count]) => ({ yearMonth, count })),
    };
  }

  return apiClient
    .get("v1/manager/orders/archive/months")
    .json<ArchiveMonthsResponse>();
}

/**
 * GET /v1/manager/orders/archive?year=&month=
 */
export async function getManagerArchiveOrders(
  query: ArchiveOrdersQuery,
): Promise<OrdersListResponse> {
  if (USE_API_MOCK) {
    await mockDelay();
    const { year, month } = query;
    const items = sessionOrders.filter((o) => {
      if (!o.archivedAt) return false;
      const d = new Date(o.createdAt);
      return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
    });
    return paginateOrders(items, query);
  }

  const params = new URLSearchParams();
  params.set("year", String(query.year));
  params.set("month", String(query.month));
  if (query.page != null) params.set("page", String(query.page));
  if (query.limit != null) params.set("limit", String(query.limit));

  return apiClient
    .get("v1/manager/orders/archive", { searchParams: params })
    .json<OrdersListResponse>();
}

/**
 * GET /v1/orders/:id
 */
export async function getOrderById(id: string): Promise<Order> {
  if (USE_API_MOCK) {
    await mockDelay();
    const order = sessionOrders.find((o) => o.id === id);
    if (!order) throw new Error("Заказ не найден");
    return order;
  }

  return apiClient.get(`v1/orders/${encodeURIComponent(id)}`).json<Order>();
}

/**
 * POST /v1/orders
 */
export async function createOrder(
  body: CreateOrderDto,
): Promise<CreateOrderResponse> {
  if (USE_API_MOCK) {
    await mockDelay(400);
    const existing = sessionOrders.find(
      (o) =>
        (o as Order & { idempotencyKey?: string }).idempotencyKey ===
        body.idempotencyKey,
    );
    if (existing) return { order: existing };

    const items = body.items.map((line) => {
      const product = getMockCatalog().find((p) => p.id === line.productId);
      if (!product) {
        throw new Error(`Товар ${line.productId} не найден`);
      }

      const selectedExtras = line.selectedExtras?.length
        ? line.selectedExtras.map((e) => {
            const fromProduct = product.extras?.find((x) => x.id === e.id);
            return {
              id: e.id,
              name: e.name || fromProduct?.name || e.id,
              price: e.price ?? fromProduct?.price ?? 0,
            };
          })
        : (product.extras ?? [])
            .filter((e) => (line.extraIds ?? []).includes(e.id))
            .map((e) => ({ id: e.id, name: e.name, price: e.price }));

      const removedIngredients = line.removedIngredients?.length
        ? line.removedIngredients.map((i) => {
            const fromProduct = product.ingredients?.find((x) => x.id === i.id);
            return {
              id: i.id,
              name: i.name || fromProduct?.name || i.id,
            };
          })
        : (product.ingredients ?? [])
            .filter((i) => (line.removedIngredientIds ?? []).includes(i.id))
            .map((i) => ({ id: i.id, name: i.name }));

      const extrasPrice = selectedExtras.reduce((sum, e) => sum + e.price, 0);
      const price = line.unitPrice ?? product.price + extrasPrice;
      return {
        productId: product.id,
        name: product.name,
        price,
        qty: line.qty,
        removedIngredientIds: removedIngredients.map((r) => r.id),
        extraIds: selectedExtras.map((e) => e.id),
        removedIngredients,
        selectedExtras,
      };
    });
    const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const order: Order = {
      id: `ORD-${1043 + sessionOrders.length}`,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      deliveryAddress: {
        street: body.deliveryAddress.street,
        house: body.deliveryAddress.house,
        ...(body.deliveryAddress.entrance
          ? { entrance: body.deliveryAddress.entrance }
          : {}),
        ...(body.deliveryAddress.apartment
          ? { apartment: body.deliveryAddress.apartment }
          : {}),
        isPrivateHouse: body.deliveryAddress.isPrivateHouse,
        formatted: [
          `ул. ${body.deliveryAddress.street}`,
          `д. ${body.deliveryAddress.house}`,
          body.deliveryAddress.isPrivateHouse
            ? "частный дом"
            : [
                body.deliveryAddress.entrance
                  ? `под. ${body.deliveryAddress.entrance}`
                  : null,
                body.deliveryAddress.apartment
                  ? `кв. ${body.deliveryAddress.apartment}`
                  : null,
              ]
                .filter(Boolean)
                .join(", "),
        ]
          .filter(Boolean)
          .join(", "),
      },
      paymentMethod: body.paymentMethod,
      items,
      total,
      status: "new",
      createdAt: new Date().toISOString(),
    };
    (order as Order & { idempotencyKey?: string }).idempotencyKey =
      body.idempotencyKey;
    sessionOrders = [order, ...sessionOrders];
    return { order };
  }

  return apiClient
    .post("v1/orders", { json: body })
    .json<CreateOrderResponse>();
}

/**
 * PATCH /v1/manager/orders/:id/status
 */
export async function patchManagerOrderStatus(
  id: string,
  body: PatchOrderStatusDto,
): Promise<Order> {
  if (USE_API_MOCK) {
    await mockDelay(200);
    const idx = sessionOrders.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error("Заказ не найден");
    const updated: Order = { ...sessionOrders[idx], status: body.status };
    sessionOrders = [
      ...sessionOrders.slice(0, idx),
      updated,
      ...sessionOrders.slice(idx + 1),
    ];
    return updated;
  }

  return apiClient
    .patch(`v1/manager/orders/${encodeURIComponent(id)}/status`, {
      json: body,
    })
    .json<Order>();
}

/** @deprecated используйте getMyOrders / getManagerOrders */
export const getOrders = getMyOrders;
/** @deprecated используйте patchManagerOrderStatus */
export const patchOrderStatus = patchManagerOrderStatus;
