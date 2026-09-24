import { Link, useParams } from "react-router-dom";
import { OrderDetails } from "@/features/orders/components/OrderDetails";
import { useOrder } from "@/features/orders/api/useOrder";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/features/auth/context/AuthModalContext";

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { openAuth } = useAuthModal();
  const { data: order, isPending, isError, error } = useOrder(id);

  if (authLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-sm text-muted-foreground sm:px-6">
        Загрузка…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
          Заказ
        </h1>
        <p className="mt-2 text-muted-foreground">
          Войдите, чтобы посмотреть заказ.
        </p>
        <button
          type="button"
          onClick={() => openAuth("login")}
          className="mt-6 rounded-md bg-mustard px-5 py-3 text-sm font-bold text-grill"
        >
          Войти
        </button>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-sm text-muted-foreground sm:px-6">
        Загрузка заказа…
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-chili">
          {error instanceof Error ? error.message : "Заказ не найден"}
        </p>
        <Link
          to="/account"
          className="mt-4 inline-flex text-sm font-semibold underline-offset-2 hover:underline"
        >
          К списку заказов
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <OrderDetails order={order} />
    </div>
  );
}
