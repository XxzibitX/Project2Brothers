import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/api";
import {
  calcUnitPrice,
  createLineId,
  resolveRemovedIngredients,
  resolveSelectedExtras,
  type CartItem,
  type CartModifiers,
} from "@/features/cart/lib/cart.types";

type AddToCartPayload = {
  product: Product;
  qty?: number;
} & CartModifiers;

type CartContextValue = {
  items: CartItem[];
  totalQty: number;
  totalPrice: number;
  addItem: (payload: AddToCartPayload) => void;
  removeLine: (lineId: string) => void;
  setLineQty: (lineId: string, qty: number) => void;
  getProductQty: (productId: string) => number;
  decreaseProductQty: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const value = useMemo<CartContextValue>(() => {
    const addItem = ({
      product,
      qty = 1,
      removedIngredientIds,
      extraIds,
    }: AddToCartPayload) => {
      const lineId = createLineId(product.id, {
        removedIngredientIds,
        extraIds,
      });
      const unitPrice = calcUnitPrice(product, extraIds);
      const removedIngredients = resolveRemovedIngredients(
        product,
        removedIngredientIds,
      );
      const selectedExtras = resolveSelectedExtras(product, extraIds);

      setItems((prev) => {
        const existing = prev.find((item) => item.lineId === lineId);
        if (existing) {
          return prev.map((item) =>
            item.lineId === lineId
              ? { ...item, qty: item.qty + qty }
              : item,
          );
        }
        return [
          ...prev,
          {
            lineId,
            product,
            qty,
            removedIngredientIds,
            extraIds,
            removedIngredients,
            selectedExtras,
            unitPrice,
          },
        ];
      });
    };

    const removeLine = (lineId: string) => {
      setItems((prev) => prev.filter((item) => item.lineId !== lineId));
    };

    const setLineQty = (lineId: string, qty: number) => {
      if (qty <= 0) {
        removeLine(lineId);
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.lineId === lineId ? { ...item, qty } : item,
        ),
      );
    };

    const getProductQty = (productId: string) =>
      items
        .filter((item) => item.product.id === productId)
        .reduce((sum, item) => sum + item.qty, 0);

    const decreaseProductQty = (productId: string) => {
      setItems((prev) => {
        const idx = [...prev]
          .map((item, i) => ({ item, i }))
          .reverse()
          .find(({ item }) => item.product.id === productId)?.i;

        if (idx === undefined) return prev;

        const target = prev[idx];
        if (target.qty <= 1) {
          return prev.filter((_, i) => i !== idx);
        }
        return prev.map((item, i) =>
          i === idx ? { ...item, qty: item.qty - 1 } : item,
        );
      });
    };

    const clear = () => setItems([]);

    const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = items.reduce(
      (sum, item) => sum + item.unitPrice * item.qty,
      0,
    );

    return {
      items,
      totalQty,
      totalPrice,
      addItem,
      removeLine,
      setLineQty,
      getProductQty,
      decreaseProductQty,
      clear,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
