import { Link } from "react-router-dom";
import type { Order } from "@/api";
import { PAYMENT_METHOD_LABELS } from "@/api";
import { formatModifiersLabel } from "@/features/cart/lib/cart.types";
import { OrderStatusTimeline } from "@/features/orders/components/OrderStatusTimeline";
import {
  isTerminalOrderStatus,
  orderStatusLabels,
} from "@/features/manager/constants/orderStatus";
import { PhoneLink } from "@/shared/components/PhoneLink";

function formatPrice(price: number) {
  return new Intl.NumberFormat("ru-RU").format(price) + " ₽";
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  order: Order;
};

export function OrderDetails({ order }: Props) {
  const live = !isTerminalOrderStatus(order.status);

  return (
    <div className="space-y-6">
      <Link
        to="/account"
        className="inline-flex text-sm font-semibold text-chili underline-offset-2 hover:underline"
      >
        ← К списку заказов
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Заказ</p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
            {order.id}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <span className="rounded-md bg-grill px-3 py-1.5 text-sm font-semibold text-mustard">
          {orderStatusLabels[order.status]}
        </span>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Статус
          </h2>
          {live ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-mustard opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-mustard" />
              </span>
              Обновляется автоматически
            </span>
          ) : null}
        </div>
        <OrderStatusTimeline status={order.status} />
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Состав</h2>
        <ul className="mt-3 divide-y divide-border">
          {order.items.map((item, idx) => (
            <li
              key={`${item.productId}-${idx}`}
              className="flex items-start justify-between gap-4 py-3"
            >
              <div>
                <p className="font-medium">
                  {item.name}{" "}
                  <span className="text-muted-foreground">×{item.qty}</span>
                </p>
                {(() => {
                  const mods = formatModifiersLabel(
                    item.removedIngredients,
                    item.selectedExtras,
                  );
                  return mods ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {mods}
                    </p>
                  ) : null;
                })()}
              </div>
              <p className="shrink-0 font-semibold tabular-nums">
                {formatPrice(item.price * item.qty)}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="text-muted-foreground">Итого</span>
          <span className="text-xl font-bold tabular-nums">
            {formatPrice(order.total)}
          </span>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 text-sm">
        <h2 className="text-lg font-semibold">Получатель</h2>
        <p className="mt-2 font-medium">{order.customerName}</p>
        {order.customerPhone && (
          <div className="mt-2">
            <PhoneLink phone={order.customerPhone} />
          </div>
        )}
        {order.deliveryAddress?.formatted ? (
          <div className="mt-3 border-t border-border pt-3">
            <p className="text-muted-foreground">Адрес доставки</p>
            <p className="mt-1 font-medium">{order.deliveryAddress.formatted}</p>
          </div>
        ) : null}
        {order.paymentMethod ? (
          <div className="mt-3 border-t border-border pt-3">
            <p className="text-muted-foreground">Оплата</p>
            <p className="mt-1 font-medium">
              {PAYMENT_METHOD_LABELS[order.paymentMethod]}
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
