import { Link } from "react-router-dom";
import { useMyOrders } from "@/features/account/api/useMyOrders";
import { formatModifiersLabel } from "@/features/cart/lib/cart.types";
import { orderStatusLabels } from "@/features/manager/constants/orderStatus";

function formatPrice(price: number) {
  return new Intl.NumberFormat("ru-RU").format(price) + " ₽";
}

function formatOrderItems(
  items: {
    name: string;
    qty: number;
    removedIngredients?: { id: string; name: string }[];
    selectedExtras?: { id: string; name: string; price: number }[];
  }[],
) {
  return items
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

export function MyOrdersList() {
  const { data, isPending, isError, error } = useMyOrders();
  const items = data?.items ?? [];

  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">Мои заказы</h2>

      {isPending && (
        <p className="mt-4 text-sm text-muted-foreground">Загрузка…</p>
      )}
      {isError && (
        <p className="mt-4 text-sm text-chili">
          {error instanceof Error ? error.message : "Ошибка загрузки"}
        </p>
      )}

      {!isPending && !isError && items.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">Заказов пока нет</p>
      )}

      <ul className="mt-4 divide-y divide-border">
        {items.map((order) => (
          <li key={order.id} className="py-3">
            <Link
              to={`/orders/${order.id}`}
              className="block rounded-md transition hover:bg-muted/40 -mx-2 px-2 py-1"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{order.id}</p>
                <span className="text-xs font-semibold">
                  {orderStatusLabels[order.status]}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatOrderItems(order.items)}
              </p>
              <p className="mt-1 text-sm font-bold tabular-nums">
                {formatPrice(order.total)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
