import { Decimal } from '@prisma/client/runtime/library';
import type {
  Product,
  ProductExtra,
  ProductIngredient,
  User,
  UserRole as PrismaUserRole,
} from '@prisma/client';
import type { UserRole } from './current-user.decorator';
import type { Prisma } from '@prisma/client';
import { formatDeliveryAddress } from '../address/address.format';

export type ProductWithRelations = Product & {
  ingredients: ProductIngredient[];
  extras: ProductExtra[];
};

/** Заказ с позициями (include: items). */
export type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true };
}>;

/** Поля адреса доставки модели Order. */
type OrderDeliveryColumns = {
  deliveryAddress: string | null;
  deliveryStreet: string | null;
  deliveryHouse: string | null;
  deliveryEntrance: string | null;
  deliveryApartment: string | null;
  deliveryIsPrivateHouse: boolean;
  paymentMethod: 'card_courier' | 'cash_courier';
};

export function toNumber(value: Decimal | number): number {
  return typeof value === 'number' ? value : Number(value);
}

export function toApiRole(role: PrismaUserRole): UserRole {
  if (role === 'OWNER') return 'owner';
  if (role === 'MANAGER') return 'manager';
  return 'user';
}

export function mapAuthUser(user: User) {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: toApiRole(user.role),
  };
}

export function mapProduct(product: ProductWithRelations) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: toNumber(product.price),
    weight: product.weight,
    category: product.category,
    image: product.image,
    ...(product.popular ? { popular: true } : {}),
    ...(product.ingredients.length
      ? {
          ingredients: product.ingredients.map((i) => ({
            id: i.key,
            name: i.name,
          })),
        }
      : {}),
    ...(product.extras.length
      ? {
          extras: product.extras.map((e) => ({
            id: e.key,
            name: e.name,
            price: toNumber(e.price),
          })),
        }
      : {}),
  };
}

type NamedMod = { id: string; name: string; price?: number };

function parseNamedMods(raw: Prisma.JsonValue): NamedMod[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (typeof entry === 'string') {
        return { id: entry, name: entry };
      }
      if (entry && typeof entry === 'object' && 'id' in entry) {
        const obj = entry as { id: string; name?: string; price?: number };
        return {
          id: String(obj.id),
          name: String(obj.name ?? obj.id),
          ...(obj.price != null ? { price: Number(obj.price) } : {}),
        };
      }
      return null;
    })
    .filter((x): x is NamedMod => x != null);
}

function enrichModName(
  mod: NamedMod,
  lookup: Map<string, { name: string; price?: number }>,
): NamedMod {
  const found = lookup.get(mod.id);
  if (!found) return mod;
  const needsName = !mod.name || mod.name === mod.id;
  return {
    id: mod.id,
    name: needsName ? found.name : mod.name,
    ...(found.price != null || mod.price != null
      ? { price: mod.price ?? found.price }
      : {}),
  };
}

/** Обогащает снимки модификаторов названиями из каталога (для старых заказов) */
export function mapOrder(
  order: OrderWithItems,
  productsById?: Map<string, ProductWithRelations>,
) {
  const {
    deliveryAddress,
    deliveryStreet,
    deliveryHouse,
    deliveryEntrance,
    deliveryApartment,
    deliveryIsPrivateHouse,
    paymentMethod,
  } = order as OrderWithItems & OrderDeliveryColumns;

  const delivery =
    deliveryStreet && deliveryHouse
      ? {
          street: deliveryStreet,
          house: deliveryHouse,
          ...(deliveryEntrance ? { entrance: deliveryEntrance } : {}),
          ...(deliveryApartment ? { apartment: deliveryApartment } : {}),
          isPrivateHouse: deliveryIsPrivateHouse,
          formatted: formatDeliveryAddress({
            street: deliveryStreet,
            house: deliveryHouse,
            entrance: deliveryEntrance,
            apartment: deliveryApartment,
            isPrivateHouse: deliveryIsPrivateHouse,
          }),
        }
      : deliveryAddress
        ? {
            street: '',
            house: '',
            isPrivateHouse: deliveryIsPrivateHouse,
            formatted: deliveryAddress,
          }
        : undefined;

  return {
    id: order.id,
    customerName: order.customerName,
    ...(order.customerPhone ? { customerPhone: order.customerPhone } : {}),
    ...(delivery ? { deliveryAddress: delivery } : {}),
    paymentMethod,
    items: order.items.map((item) => {
      const product = item.productId
        ? productsById?.get(item.productId)
        : undefined;
      const ingLookup = new Map(
        (product?.ingredients ?? []).map((i) => [i.key, { name: i.name }]),
      );
      const extraLookup = new Map(
        (product?.extras ?? []).map((e) => [
          e.key,
          { name: e.name, price: toNumber(e.price) },
        ]),
      );

      const removedIngredients = parseNamedMods(item.removedIngredientIds).map(
        (m) => enrichModName(m, ingLookup),
      );
      const selectedExtras = parseNamedMods(item.extraIds).map((m) => {
        const enriched = enrichModName(m, extraLookup);
        return {
          id: enriched.id,
          name: enriched.name,
          price: enriched.price ?? 0,
        };
      });

      return {
        productId: item.productId ?? "",
        name: item.name,
        price: toNumber(item.price),
        qty: item.qty,
        removedIngredientIds: removedIngredients.map((r) => r.id),
        extraIds: selectedExtras.map((e) => e.id),
        removedIngredients,
        selectedExtras,
      };
    }),
    total: toNumber(order.total),
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    ...(order.archivedAt
      ? { archivedAt: order.archivedAt.toISOString() }
      : {}),
  };
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}
