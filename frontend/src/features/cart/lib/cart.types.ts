import type {
  OrderRemovedIngredient,
  OrderSelectedExtra,
} from "@/api/orders/orders.entities";
import type { Product } from "@/api";

export type CartModifiers = {
  removedIngredientIds: string[];
  extraIds: string[];
};

export type CartItem = {
  lineId: string;
  product: Product;
  qty: number;
  removedIngredientIds: string[];
  extraIds: string[];
  removedIngredients: OrderRemovedIngredient[];
  selectedExtras: OrderSelectedExtra[];
  unitPrice: number;
};

export function calcUnitPrice(product: Product, extraIds: string[]): number {
  const extrasPrice = (product.extras ?? [])
    .filter((e) => extraIds.includes(e.id))
    .reduce((sum, e) => sum + e.price, 0);
  return product.price + extrasPrice;
}

export function modifiersKey(
  removedIngredientIds: string[],
  extraIds: string[],
): string {
  return `${[...removedIngredientIds].sort().join(",")}|${[...extraIds].sort().join(",")}`;
}

export function createLineId(productId: string, modifiers: CartModifiers) {
  return `${productId}__${modifiersKey(modifiers.removedIngredientIds, modifiers.extraIds)}`;
}

export function resolveRemovedIngredients(
  product: Product,
  ids: string[],
): OrderRemovedIngredient[] {
  return ids.map((id) => ({
    id,
    name: product.ingredients?.find((i) => i.id === id)?.name ?? id,
  }));
}

export function resolveSelectedExtras(
  product: Product,
  ids: string[],
): OrderSelectedExtra[] {
  return ids.map((id) => {
    const extra = product.extras?.find((e) => e.id === id);
    return {
      id,
      name: extra?.name ?? id,
      price: extra?.price ?? 0,
    };
  });
}

export function formatModifiersLabel(
  removed: OrderRemovedIngredient[] | undefined,
  extras: OrderSelectedExtra[] | undefined,
): string {
  const parts: string[] = [];
  for (const item of removed ?? []) {
    parts.push(`без ${item.name.toLowerCase()}`);
  }
  for (const item of extras ?? []) {
    parts.push(`+ ${item.name}`);
  }
  return parts.join(", ");
}

/** @deprecated use formatModifiersLabel with snapshots */
export function formatCartModifiers(
  product: Product,
  removedIngredientIds: string[],
  extraIds: string[],
): string {
  return formatModifiersLabel(
    resolveRemovedIngredients(product, removedIngredientIds),
    resolveSelectedExtras(product, extraIds),
  );
}
