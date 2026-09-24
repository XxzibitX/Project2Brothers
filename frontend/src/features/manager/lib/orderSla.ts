import type { OrderStatus } from "@/api";
import type { OrderSlaConfig } from "@/api";
import { DEFAULT_ORDER_SLA } from "@/api";

export type OrderSlaTone = "none" | "green" | "yellow" | "red";

export function getElapsedMs(createdAt: string, nowMs: number): number {
  return Math.max(0, nowMs - new Date(createdAt).getTime());
}

export function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function getOrderSlaTone(
  status: OrderStatus,
  createdAt: string,
  nowMs: number,
  sla: OrderSlaConfig = DEFAULT_ORDER_SLA,
): OrderSlaTone {
  if (status === "done" || status === "cancelled") return "none";

  const minutes = getElapsedMs(createdAt, nowMs) / 60_000;
  if (minutes < sla.greenMinutes) return "green";
  if (minutes < sla.yellowMinutes) return "yellow";
  return "red";
}

export const orderSlaToneClass: Record<OrderSlaTone, string> = {
  none: "border-border bg-card",
  green: "border-emerald-500/35 bg-emerald-500/10",
  yellow: "border-amber-400/45 bg-amber-400/15",
  red: "border-chili/40 bg-chili/10",
};
