import { useEffect, useMemo, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import type { Product } from "@/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCart } from "@/features/cart/context/CartContext";
import { calcUnitPrice } from "@/features/cart/lib/cart.types";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/ProductImage";

type Props = {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("ru-RU").format(price) + " ₽";
}

export function ProductCustomizeModal({
  product,
  open,
  onOpenChange,
}: Props) {
  const { addItem } = useCart();
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (open) {
      setRemovedIds([]);
      setExtraIds([]);
      setQty(1);
    }
  }, [open, product?.id]);

  const unitPrice = useMemo(
    () => (product ? calcUnitPrice(product, extraIds) : 0),
    [product, extraIds],
  );

  const total = unitPrice * qty;
  const ingredients = product?.ingredients ?? [];
  const extras = product?.extras ?? [];
  const hasOptions = ingredients.length > 0 || extras.length > 0;

  const toggleRemoved = (id: string) => {
    setRemovedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleExtra = (id: string) => {
    setExtraIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const onConfirm = () => {
    if (!product) return;
    addItem({
      product,
      qty,
      removedIngredientIds: removedIds,
      extraIds,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-border bg-card text-foreground sm:rounded-xl">
        {product && (
          <>
            <div className="-mx-6 -mt-6 mb-2 overflow-hidden sm:rounded-t-xl">
              <ProductImage
                src={product.image}
                alt={product.name}
                priority
                className="h-44 w-full sm:h-52"
              />
            </div>

            <DialogHeader>
              <DialogTitle className="font-[family-name:var(--font-display)] text-xl">
                {product.name}
              </DialogTitle>
              <DialogDescription>{product.description}</DialogDescription>
            </DialogHeader>

            {ingredients.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Убрать из состава</h3>
                <p className="text-xs text-muted-foreground">
                  Нажмите, чтобы исключить ингредиент
                </p>
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((item) => {
                    const removed = removedIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleRemoved(item.id)}
                        className={cn(
                          "rounded-md border px-3 py-2 text-sm font-medium transition",
                          removed
                            ? "border-chili/40 bg-chili/10 text-chili line-through"
                            : "border-border bg-background hover:border-grill/30",
                        )}
                      >
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {extras.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Добавить</h3>
                <div className="space-y-2">
                  {extras.map((extra) => {
                    const selected = extraIds.includes(extra.id);
                    return (
                      <button
                        key={extra.id}
                        type="button"
                        onClick={() => toggleExtra(extra.id)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md border px-3 py-3 text-left text-sm transition",
                          selected
                            ? "border-mustard bg-mustard/15"
                            : "border-border bg-background hover:border-grill/30",
                        )}
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <span
                            className={cn(
                              "grid h-5 w-5 place-items-center rounded border",
                              selected
                                ? "border-grill bg-grill text-mustard"
                                : "border-border",
                            )}
                          >
                            {selected && <Check className="h-3.5 w-3.5" />}
                          </span>
                          {extra.name}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          +{formatPrice(extra.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {!hasOptions && (
              <p className="text-sm text-muted-foreground">
                Без дополнительных опций — можно сразу добавить в заказ.
              </p>
            )}

            <div className="space-y-4 border-t border-border pt-4">
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-md bg-muted"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Меньше"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-8 text-center text-lg font-bold tabular-nums">
                  {qty}
                </span>
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-md bg-grill text-mustard"
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="Больше"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="w-full rounded-md border border-border px-5 py-3 text-sm font-medium"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className="w-full rounded-md bg-mustard px-5 py-3 text-sm font-bold text-grill"
                >
                  В корзину · {formatPrice(total)}
                </button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
