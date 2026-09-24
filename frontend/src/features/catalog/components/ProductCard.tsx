import { useState } from "react";
import { Plus } from "lucide-react";
import type { Product } from "@/api";
import { ProductCustomizeModal } from "@/features/catalog/components/ProductCustomizeModal";
import { useCart } from "@/features/cart/context/CartContext";
import { ProductImage } from "@/components/ProductImage";

function formatPrice(price: number) {
  return new Intl.NumberFormat("ru-RU").format(price) + " ₽";
}

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const { getProductQty, decreaseProductQty } = useCart();
  const [modalOpen, setModalOpen] = useState(false);
  const qty = getProductQty(product.id);

  return (
    <>
      <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_0_rgb(20_17_15/6%)] transition duration-300 hover:-translate-y-0.5 hover:border-mustard/40">
        <div className="relative">
          <ProductImage
            src={product.image}
            alt={product.name}
            priority={priority}
            className="aspect-[4/3]"
            imgClassName="transition duration-500 group-hover:scale-[1.04]"
          />
          {product.popular && (
            <span className="absolute left-3 top-3 z-10 rounded-md bg-grill/85 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-mustard backdrop-blur">
              Хит
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
                {product.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {product.description}
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {product.weight}
            </span>
          </div>
          <div className="mt-auto flex items-center justify-between gap-3 pt-1">
            <span className="text-lg font-bold tabular-nums">
              {formatPrice(product.price)}
            </span>

            {qty === 0 ? (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground transition hover:bg-smoke"
              >
                <Plus className="h-4 w-4" />
                В заказ
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="h-9 w-9 rounded-md bg-muted text-base font-bold"
                  onClick={() => decreaseProductQty(product.id)}
                  aria-label="Уменьшить"
                >
                  −
                </button>
                <span className="min-w-6 text-center text-sm font-bold tabular-nums">
                  {qty}
                </span>
                <button
                  type="button"
                  className="h-9 w-9 rounded-md bg-grill text-base font-bold text-mustard"
                  onClick={() => setModalOpen(true)}
                  aria-label="Добавить ещё"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </article>

      <ProductCustomizeModal
        product={product}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
