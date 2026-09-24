import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { PaymentMethod } from "@/api";
import { useCreateOrder } from "@/features/account/api/useMyOrders";
import { useAuthModal } from "@/features/auth/context/AuthModalContext";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/features/cart/context/CartContext";
import { formatModifiersLabel } from "@/features/cart/lib/cart.types";
import {
  DeliveryAddressForm,
  emptyDeliveryAddress,
} from "@/features/cart/components/DeliveryAddressForm";
import { PaymentMethodForm } from "@/features/cart/components/PaymentMethodForm";
import {
  toDeliveryAddressPayload,
  validateDeliveryAddress,
  type DeliveryAddressErrors,
  type DeliveryAddressInput,
} from "@/features/cart/lib/deliveryAddress";

function formatPrice(price: number) {
  return new Intl.NumberFormat("ru-RU").format(price) + " ₽";
}

function newIdempotencyKey() {
  return crypto.randomUUID();
}

export function CartPanel() {
  const navigate = useNavigate();
  const { items, totalPrice, totalQty, setLineQty, clear } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { openAuth } = useAuthModal();
  const createOrder = useCreateOrder();
  const idempotencyKeyRef = useRef(newIdempotencyKey());
  const [address, setAddress] =
    useState<DeliveryAddressInput>(emptyDeliveryAddress);
  const [addressErrors, setAddressErrors] = useState<DeliveryAddressErrors>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [paymentError, setPaymentError] = useState<string | undefined>();

  const onSubmit = async () => {
    if (items.length === 0) return;

    if (!isAuthenticated) {
      openAuth("login");
      return;
    }

    const errors = validateDeliveryAddress(address);
    setAddressErrors(errors);

    if (!paymentMethod) {
      setPaymentError("Выберите способ оплаты");
    } else {
      setPaymentError(undefined);
    }

    if (Object.keys(errors).length > 0 || !paymentMethod) return;

    const deliveryAddress = toDeliveryAddressPayload(address);

    try {
      const { order } = await createOrder.mutateAsync({
        customerName: user?.name || "Гость",
        customerPhone: user?.phone,
        deliveryAddress: {
          street: deliveryAddress.street,
          house: deliveryAddress.house,
          ...(deliveryAddress.entrance
            ? { entrance: deliveryAddress.entrance }
            : {}),
          ...(deliveryAddress.apartment
            ? { apartment: deliveryAddress.apartment }
            : {}),
          isPrivateHouse: deliveryAddress.isPrivateHouse,
        },
        paymentMethod,
        idempotencyKey: idempotencyKeyRef.current,
        items: items.map((item) => ({
          productId: item.product.id,
          qty: item.qty,
          removedIngredientIds: item.removedIngredientIds,
          extraIds: item.extraIds,
          removedIngredients: item.removedIngredients,
          selectedExtras: item.selectedExtras,
          unitPrice: item.unitPrice,
        })),
      });
      clear();
      setAddress(emptyDeliveryAddress);
      setAddressErrors({});
      setPaymentMethod(null);
      setPaymentError(undefined);
      idempotencyKeyRef.current = newIdempotencyKey();
      navigate(`/orders/${order.id}`);
    } catch {
      // ошибка уже в createOrder.error; тот же idempotencyKey при повторе
    }
  };

  return (
    <div className="space-y-5">
      {items.length > 0 && (
        <>
          <DeliveryAddressForm
            value={address}
            onChange={(next) => {
              setAddress(next);
              if (Object.keys(addressErrors).length) {
                setAddressErrors(validateDeliveryAddress(next));
              }
            }}
            errors={addressErrors}
            disabled={createOrder.isPending}
          />
          <PaymentMethodForm
            value={paymentMethod}
            onChange={(next) => {
              setPaymentMethod(next);
              setPaymentError(undefined);
            }}
            error={paymentError}
            disabled={createOrder.isPending}
          />
        </>
      )}

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Ваш заказ</h2>
          {totalQty > 0 && (
            <button
              type="button"
              onClick={clear}
              className="text-sm text-muted-foreground underline-offset-2 hover:underline"
            >
              Очистить
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="mt-6 text-sm text-muted-foreground">
            Корзина пуста. <br />
            <Link
              to="/"
              state={{ scrollToMenu: true }}
              className="font-semibold text-chili"
            >
              Перейти в меню
            </Link>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {items.map((item) => {
              const mods = formatModifiersLabel(
                item.removedIngredients,
                item.selectedExtras,
              );
              return (
                <li
                  key={item.lineId}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{item.product.name}</p>
                    {mods ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {mods}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatPrice(item.unitPrice)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      className="h-8 w-8 rounded-md bg-muted font-bold"
                      onClick={() => setLineQty(item.lineId, item.qty - 1)}
                    >
                      −
                    </button>
                    <span className="w-6 text-center tabular-nums">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      className="h-8 w-8 rounded-md bg-muted font-bold"
                      onClick={() => setLineQty(item.lineId, item.qty + 1)}
                    >
                      +
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <span className="text-muted-foreground">Итого</span>
          <span className="text-xl font-bold tabular-nums">
            {formatPrice(totalPrice)}
          </span>
        </div>

        {createOrder.isError && (
          <p className="mt-3 text-sm text-chili" role="alert">
            {createOrder.error instanceof Error
              ? createOrder.error.message
              : "Ошибка оформления"}
            . Если заказ всё же создался — откройте{" "}
            <Link
              to="/account"
              className="font-semibold underline-offset-2 hover:underline"
            >
              Мои заказы
            </Link>
            .
          </p>
        )}

        <button
          type="button"
          disabled={items.length === 0 || createOrder.isPending}
          onClick={onSubmit}
          className="mt-4 w-full rounded-md bg-mustard py-3 text-sm font-bold text-grill disabled:opacity-40"
        >
          {createOrder.isPending ? "Оформляем…" : "Оформить заказ"}
        </button>

        {!isAuthenticated && items.length > 0 && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Для оформления нужно войти или зарегистрироваться
          </p>
        )}
      </section>
    </div>
  );
}
