import { useEffect, useMemo, useState } from "react";
import type { Order, OrderSlaConfig, OrderStatus } from "@/api";
import { DEFAULT_ORDER_SLA, PAYMENT_METHOD_LABELS } from "@/api";
import { formatModifiersLabel } from "@/features/cart/lib/cart.types";
import {
  useArchiveMonths,
  useArchiveOrders,
  useOrders,
  usePatchOrderStatus,
} from "@/features/manager/api/useOrders";
import {
  useOrderSla,
  useUpdateOrderSla,
} from "@/features/manager/api/useOrderSla";
import {
  orderStatusFlow,
  orderStatusLabels,
} from "@/features/manager/constants/orderStatus";
import { useNow } from "@/features/manager/hooks/useNow";
import {
  formatElapsed,
  getElapsedMs,
  getOrderSlaTone,
  orderSlaToneClass,
} from "@/features/manager/lib/orderSla";
import { useToast } from "@/shared/ui/toast";
import { PhoneLink } from "@/shared/components/PhoneLink";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 8;

type OrdersTab = "active" | "completed" | "archive";

const MONTH_LABELS = [
  "январь",
  "февраль",
  "март",
  "апрель",
  "май",
  "июнь",
  "июль",
  "август",
  "сентябрь",
  "октябрь",
  "ноябрь",
  "декабрь",
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
  });
}

function formatYearMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return `${MONTH_LABELS[m - 1]} ${y}`;
}

function parseYearMonth(ym: string): { year: number; month: number } | null {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return null;
  return { year: y, month: m };
}

function formatItemLine(order: Order) {
  return order.items
    .map((item) => {
      const mods = formatModifiersLabel(
        item.removedIngredients,
        item.selectedExtras,
      );
      return mods
        ? `${item.name} ×${item.qty} (${mods})`
        : `${item.name} ×${item.qty}`;
    })
    .join(", ");
}

function OrderSlaSettings({ sla }: { sla: OrderSlaConfig }) {
  const updateSla = useUpdateOrderSla();
  const toast = useToast();
  const [green, setGreen] = useState(String(sla.greenMinutes));
  const [yellow, setYellow] = useState(String(sla.yellowMinutes));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setGreen(String(sla.greenMinutes));
    setYellow(String(sla.yellowMinutes));
  }, [sla.greenMinutes, sla.yellowMinutes]);

  const onSave = async () => {
    const greenMinutes = Number(green);
    const yellowMinutes = Number(yellow);
    if (!Number.isFinite(greenMinutes) || greenMinutes < 1) {
      toast.error("Зелёный порог — число минут ≥ 1");
      return;
    }
    if (!Number.isFinite(yellowMinutes) || yellowMinutes <= greenMinutes) {
      toast.error("Жёлтый порог должен быть больше зелёного");
      return;
    }
    try {
      await updateSla.mutateAsync({
        greenMinutes: Math.round(greenMinutes),
        yellowMinutes: Math.round(yellowMinutes),
      });
      toast.success("Пороги времени сохранены");
      setOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Не удалось сохранить настройки",
      );
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium"
      >
        <span>Цвет заказа по времени ожидания</span>
        <span className="text-muted-foreground">
          {sla.greenMinutes} / {sla.yellowMinutes} мин ·{" "}
          {open ? "Скрыть" : "Настроить"}
        </span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">
            До N минут — зелёный, до M — жёлтый, дальше — красный. Выданные и
            отменённые не подсвечиваются. Считается от времени создания заказа.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="font-medium">Зелёный до (мин)</span>
              <input
                type="number"
                min={1}
                value={green}
                onChange={(e) => setGreen(e.target.value)}
                className="mt-1 w-28 rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="font-medium">Жёлтый до (мин)</span>
              <input
                type="number"
                min={1}
                value={yellow}
                onChange={(e) => setYellow(e.target.value)}
                className="mt-1 w-28 rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <button
              type="button"
              onClick={onSave}
              disabled={updateSla.isPending}
              className="rounded-md bg-grill px-4 py-2 text-sm font-semibold text-mustard disabled:opacity-60"
            >
              {updateSla.isPending ? "Сохраняем…" : "Сохранить"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  now,
  sla,
  readOnly = false,
}: {
  order: Order;
  now: number;
  sla: OrderSlaConfig;
  readOnly?: boolean;
}) {
  const patchStatus = usePatchOrderStatus();
  const tone = getOrderSlaTone(order.status, order.createdAt, now, sla);
  const elapsed = formatElapsed(getElapsedMs(order.createdAt, now));
  const showTimer =
    !readOnly && order.status !== "done" && order.status !== "cancelled";

  const setStatus = (status: OrderStatus) => {
    patchStatus.mutate({ id: order.id, status });
  };

  const advance = () => {
    const idx = orderStatusFlow.indexOf(order.status);
    if (idx === -1 || idx >= orderStatusFlow.length - 1) return;
    setStatus(orderStatusFlow[idx + 1]);
  };

  return (
    <article
      className={cn(
        "flex h-full min-h-[220px] flex-col rounded-xl border p-4 transition-colors",
        orderSlaToneClass[tone],
        order.status === "new" && !readOnly && "ring-2 ring-mustard/70",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-semibold">{order.id}</h2>
        <span
          className={cn(
            "rounded-md px-2 py-0.5 text-xs font-semibold",
            order.status === "new" && "bg-mustard/30 text-grill",
            order.status === "cooking" && "bg-chili/15 text-chili",
            order.status === "ready" && "bg-accent text-foreground",
            order.status === "courier" && "bg-mustard/20 text-grill",
            order.status === "done" && "bg-muted text-muted-foreground",
            order.status === "cancelled" && "bg-muted text-muted-foreground",
          )}
        >
          {orderStatusLabels[order.status]}
        </span>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>
          {formatDate(order.createdAt)} · {formatTime(order.createdAt)}
        </span>
        {showTimer && (
          <span className="rounded-md bg-background/70 px-2 py-0.5 font-semibold tabular-nums text-foreground">
            {elapsed}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-sm font-medium">{order.customerName}</span>
        {order.customerPhone ? (
          <PhoneLink phone={order.customerPhone} />
        ) : (
          <span className="text-sm text-muted-foreground">нет телефона</span>
        )}
      </div>

      {order.deliveryAddress?.formatted ? (
        <p className="mt-1.5 line-clamp-2 text-sm text-foreground/90">
          <span className="text-muted-foreground">Адрес: </span>
          {order.deliveryAddress.formatted}
        </p>
      ) : null}

      {order.paymentMethod ? (
        <p className="mt-1 text-sm text-foreground/90">
          <span className="text-muted-foreground">Оплата: </span>
          {PAYMENT_METHOD_LABELS[order.paymentMethod]}
        </p>
      ) : null}

      <p className="mt-1 line-clamp-3 flex-1 text-sm text-muted-foreground">
        {formatItemLine(order)}
      </p>
      <p className="mt-2 text-sm font-bold tabular-nums">{order.total} ₽</p>

      {!readOnly && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border/60 pt-3">
          <select
            value={order.status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            disabled={patchStatus.isPending}
            className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-2 text-sm"
          >
            {(Object.keys(orderStatusLabels) as OrderStatus[]).map((key) => (
              <option key={key} value={key}>
                {orderStatusLabels[key]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={advance}
            disabled={
              patchStatus.isPending ||
              order.status === "done" ||
              order.status === "cancelled"
            }
            className="rounded-md bg-grill px-3 py-2 text-sm font-semibold text-mustard disabled:opacity-40"
          >
            Далее
          </button>
        </div>
      )}
    </article>
  );
}

function OrdersPagination({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
      <p className="text-sm text-muted-foreground">
        Страница {page} из {totalPages} · {total}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(Math.max(1, page - 1))}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium disabled:opacity-40"
        >
          Назад
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium disabled:opacity-40"
        >
          Вперёд
        </button>
      </div>
    </div>
  );
}

function OrdersGrid({
  items,
  now,
  sla,
  readOnly,
  emptyText,
}: {
  items: Order[];
  now: number;
  sla: OrderSlaConfig;
  readOnly?: boolean;
  emptyText: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          now={now}
          sla={sla}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

export function ManagerOrdersPanel() {
  const [tab, setTab] = useState<OrdersTab>("active");
  const [page, setPage] = useState(1);
  const [archiveMonth, setArchiveMonth] = useState<string | null>(null);
  const now = useNow(1_000);
  const { data: slaData } = useOrderSla();
  const sla = slaData ?? DEFAULT_ORDER_SLA;

  useEffect(() => {
    setPage(1);
  }, [tab]);

  const archiveParsed = useMemo(
    () => (archiveMonth ? parseYearMonth(archiveMonth) : null),
    [archiveMonth],
  );

  const liveQuery = useOrders(
    {
      bucket: tab === "completed" ? "completed" : "active",
      page,
      limit: PAGE_SIZE,
    },
    tab !== "archive",
  );

  const monthsQuery = useArchiveMonths(tab === "archive");
  const archiveQuery = useArchiveOrders(
    archiveParsed
      ? { ...archiveParsed, page, limit: PAGE_SIZE }
      : null,
    tab === "archive",
  );

  useEffect(() => {
    if (tab !== "archive") return;
    const first = monthsQuery.data?.items[0]?.yearMonth;
    if (!archiveMonth && first) setArchiveMonth(first);
  }, [tab, monthsQuery.data, archiveMonth]);

  const tabs: Array<{ id: OrdersTab; label: string }> = [
    { id: "active", label: "В работе" },
    { id: "completed", label: "Завершённые" },
    { id: "archive", label: "Архив" },
  ];

  return (
    <div className="space-y-4">
      <OrderSlaSettings sla={sla} />

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-semibold transition-colors",
              tab === t.id
                ? "bg-grill text-mustard"
                : "border border-border bg-background text-foreground hover:bg-muted/50",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== "archive" && (
        <>
          {liveQuery.isPending ? (
            <p className="text-sm text-muted-foreground">Загрузка заказов…</p>
          ) : liveQuery.isError ? (
            <p className="text-sm text-chili">
              {liveQuery.error instanceof Error
                ? liveQuery.error.message
                : "Ошибка загрузки заказов"}
            </p>
          ) : (
            <>
              <OrdersGrid
                items={liveQuery.data?.items ?? []}
                now={now}
                sla={sla}
                emptyText={
                  tab === "active"
                    ? "Нет заказов в работе"
                    : "Нет завершённых заказов за последние 30 дней"
                }
              />
              <OrdersPagination
                page={page}
                totalPages={Math.max(
                  1,
                  Math.ceil((liveQuery.data?.total ?? 0) / PAGE_SIZE),
                )}
                total={liveQuery.data?.total ?? 0}
                onPage={setPage}
              />
            </>
          )}
        </>
      )}

      {tab === "archive" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Заказы старше 30 дней уходят в архив. Загружается один месяц за раз.
          </p>

          {monthsQuery.isPending ? (
            <p className="text-sm text-muted-foreground">Загрузка месяцев…</p>
          ) : monthsQuery.isError ? (
            <p className="text-sm text-chili">
              {monthsQuery.error instanceof Error
                ? monthsQuery.error.message
                : "Не удалось загрузить архив"}
            </p>
          ) : (monthsQuery.data?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Архив пока пуст</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {monthsQuery.data!.items.map((m) => (
                  <button
                    key={m.yearMonth}
                    type="button"
                    onClick={() => {
                      setArchiveMonth(m.yearMonth);
                      setPage(1);
                    }}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm font-medium",
                      archiveMonth === m.yearMonth
                        ? "border-grill bg-grill/10 text-grill"
                        : "border-border bg-background",
                    )}
                  >
                    {formatYearMonth(m.yearMonth)} · {m.count}
                  </button>
                ))}
              </div>

              {archiveQuery.isPending ? (
                <p className="text-sm text-muted-foreground">
                  Загрузка архива…
                </p>
              ) : archiveQuery.isError ? (
                <p className="text-sm text-chili">
                  {archiveQuery.error instanceof Error
                    ? archiveQuery.error.message
                    : "Ошибка загрузки архива"}
                </p>
              ) : (
                <>
                  <OrdersGrid
                    items={archiveQuery.data?.items ?? []}
                    now={now}
                    sla={sla}
                    readOnly
                    emptyText="В этом месяце нет архивных заказов"
                  />
                  <OrdersPagination
                    page={page}
                    totalPages={Math.max(
                      1,
                      Math.ceil((archiveQuery.data?.total ?? 0) / PAGE_SIZE),
                    )}
                    total={archiveQuery.data?.total ?? 0}
                    onPage={setPage}
                  />
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
