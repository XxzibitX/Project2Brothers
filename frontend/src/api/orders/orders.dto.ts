import type {
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
} from "./orders.entities";

/** GET /v1/orders | GET /v1/manager/orders */
export interface OrdersQuery {
  status?: OrderStatus;
  /** manager: active | completed */
  bucket?: "active" | "completed";
  page?: number;
  limit?: number;
}

/** GET /v1/manager/orders/archive */
export interface ArchiveOrdersQuery {
  year: number;
  month: number;
  page?: number;
  limit?: number;
}

export interface ArchiveMonthItem {
  yearMonth: string;
  count: number;
}

export interface ArchiveMonthsResponse {
  items: ArchiveMonthItem[];
}

/** Список заказов */
export interface OrdersListResponse {
  items: Order[];
  total?: number;
  page?: number;
  limit?: number;
}

/** POST /v1/orders */
export interface CreateOrderDto {
  customerName: string;
  customerPhone?: string;
  deliveryAddress: {
    street: string;
    house: string;
    entrance?: string;
    apartment?: string;
    isPrivateHouse: boolean;
  };
  paymentMethod: PaymentMethod;
  /** UUID — один ключ на попытку оформления (защита от дублей) */
  idempotencyKey: string;
  items: Array<{
    productId: string;
    qty: number;
    removedIngredientIds?: string[];
    extraIds?: string[];
    removedIngredients?: Array<{ id: string; name: string }>;
    selectedExtras?: Array<{ id: string; name: string; price: number }>;
    /** Если бэкенд считает сам — можно не слать */
    unitPrice?: number;
  }>;
}

/** POST /v1/orders → body */
export interface CreateOrderResponse {
  order: Order;
}

/** PATCH /v1/manager/orders/:id/status */
export interface PatchOrderStatusDto {
  status: OrderStatus;
}

export type { OrderItem };
