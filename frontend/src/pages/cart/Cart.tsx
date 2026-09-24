import { CartPanel } from "@/features/cart/components/CartPanel";

export default function Cart() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
        Корзина
      </h1>
      <p className="mt-2 text-muted-foreground">
        Укажите адрес, способ оплаты и оформите заказ.
      </p>

      <div className="mt-8">
        <CartPanel />
      </div>
    </div>
  );
}
