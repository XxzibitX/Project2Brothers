import type { OrderStatus } from "@/api";

export const orderStatusLabels: Record<OrderStatus, string> = {
  new: "Принят",
  cooking: "Готовится",
  ready: "Готов",
  courier: "У курьера",
  done: "Выдан",
  cancelled: "Отменён",
};

/** Основной поток (без cancelled) — 5 шагов */
export const orderStatusFlow: OrderStatus[] = [
  "new",
  "cooking",
  "ready",
  "courier",
  "done",
];

export const orderTimelineSteps: Array<{
  status: OrderStatus;
  label: string;
}> = [
  { status: "new", label: "Принят" },
  { status: "cooking", label: "Готовится" },
  { status: "ready", label: "Готов" },
  { status: "courier", label: "У курьера" },
  { status: "done", label: "Выдан" },
];

/** Финальные статусы — дальше поллинг не нужен */
export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return status === "done" || status === "cancelled";
}
