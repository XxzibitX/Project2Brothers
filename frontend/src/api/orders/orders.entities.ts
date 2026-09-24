import type { DeliveryAddress } from "@/api/address/address.entities";

export type OrderStatus =
  | "new"
  | "cooking"
  | "ready"
  | "courier"
  | "done"
  | "cancelled";

export type PaymentMethod = "card_courier" | "cash_courier";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card_courier: "Картой курьеру",
  cash_courier: "Наличными курьеру",
};

export interface OrderRemovedIngredient {
  id: string;
  name: string;
}

export interface OrderSelectedExtra {
  id: string;
  name: string;
  price: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  /** Цена за 1 шт. с учётом допов */
  price: number;
  qty: number;
  removedIngredientIds?: string[];
  extraIds?: string[];
  /** Снимки с названиями для отображения */
  removedIngredients?: OrderRemovedIngredient[];
  selectedExtras?: OrderSelectedExtra[];
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: DeliveryAddress;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  /** ISO-8601 */
  createdAt: string;
  /** ISO-8601 — если заказ в архиве */
  archivedAt?: string;
}
