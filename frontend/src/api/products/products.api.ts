import { apiClient } from "@/api/config";
import { mockDelay, USE_API_MOCK } from "@/api/mock";
import type {
  CategoriesListResponse,
  CreateCategoryDto,
  ExtrasListResponse,
  ProductsListResponse,
  ProductsQuery,
  UpsertMenuExtraDto,
  UpsertProductDto,
} from "./products.dto";
import type { MenuCategory, MenuExtra, Product } from "./products.entities";
import { mockProducts } from "./products.mock";

/** Мутабельный каталог для мок-CRUD менеджера */
let sessionProducts: Product[] = structuredClone(mockProducts);

let sessionCategories: MenuCategory[] = [
  { id: "cat-shawarma", key: "shawarma", name: "Шаурма", sortOrder: 0 },
  { id: "cat-sides", key: "sides", name: "Гарниры", sortOrder: 1 },
  { id: "cat-drinks", key: "drinks", name: "Напитки", sortOrder: 2 },
  { id: "cat-sauces", key: "sauces", name: "Соусы", sortOrder: 3 },
];

function collectInitialExtras(): MenuExtra[] {
  const map = new Map<string, MenuExtra>();
  for (const product of mockProducts) {
    for (const extra of product.extras ?? []) {
      if (!map.has(extra.id)) {
        map.set(extra.id, {
          id: extra.id,
          key: extra.id,
          name: extra.name,
          price: extra.price,
        });
      }
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

let sessionExtras: MenuExtra[] = collectInitialExtras();

/** Для мок-заказов: актуальный каталог после CRUD */
export function getMockCatalog(): Product[] {
  return sessionProducts;
}

export function getMockCategories(): MenuCategory[] {
  return sessionCategories;
}

function toSearchParams(query: ProductsQuery = {}) {
  const params = new URLSearchParams();
  if (query.category) params.set("category", query.category);
  return params;
}

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || `item-${Date.now()}`;
}

function autoKey(name: string) {
  return `${slugify(name) || "item"}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * GET /v1/products
 */
export async function getProducts(
  query: ProductsQuery = {},
): Promise<ProductsListResponse> {
  if (USE_API_MOCK) {
    await mockDelay();
    const items = query.category
      ? sessionProducts.filter((p) => p.category === query.category)
      : sessionProducts;
    return { items };
  }

  return apiClient
    .get("v1/products", { searchParams: toSearchParams(query) })
    .json<ProductsListResponse>();
}

/**
 * GET /v1/products/:id
 */
export async function getProductById(id: string): Promise<Product> {
  if (USE_API_MOCK) {
    await mockDelay();
    const product = sessionProducts.find((p) => p.id === id);
    if (!product) {
      throw new Error("Товар не найден");
    }
    return product;
  }

  return apiClient
    .get(`v1/products/${encodeURIComponent(id)}`)
    .json<Product>();
}

/**
 * GET /v1/categories
 */
export async function getCategories(): Promise<CategoriesListResponse> {
  if (USE_API_MOCK) {
    await mockDelay();
    return {
      items: [...sessionCategories].sort((a, b) => a.sortOrder - b.sortOrder),
    };
  }

  return apiClient.get("v1/categories").json<CategoriesListResponse>();
}

/**
 * POST /v1/manager/categories
 */
export async function createManagerCategory(
  body: CreateCategoryDto,
): Promise<MenuCategory> {
  if (USE_API_MOCK) {
    await mockDelay(200);
    const name = body.name.trim();
    if (!name) throw new Error("Укажите название категории");
    let key = slugify(name);
    if (sessionCategories.some((c) => c.key === key)) {
      key = `${key}-${Date.now().toString(36)}`;
    }
    const category: MenuCategory = {
      id: `cat-${Date.now().toString(36)}`,
      key,
      name,
      sortOrder:
        Math.max(-1, ...sessionCategories.map((c) => c.sortOrder)) + 1,
    };
    sessionCategories = [...sessionCategories, category];
    return category;
  }

  return apiClient
    .post("v1/manager/categories", { json: body })
    .json<MenuCategory>();
}

/**
 * DELETE /v1/manager/categories/:key
 */
export async function deleteManagerCategory(
  key: string,
): Promise<{ ok: boolean }> {
  if (USE_API_MOCK) {
    await mockDelay(200);
    const used = sessionProducts.some((p) => p.category === key);
    if (used) {
      throw new Error(
        "Нельзя удалить: в категории есть товары. Сначала перенесите или удалите их.",
      );
    }
    const idx = sessionCategories.findIndex((c) => c.key === key);
    if (idx === -1) throw new Error("Категория не найдена");
    sessionCategories = [
      ...sessionCategories.slice(0, idx),
      ...sessionCategories.slice(idx + 1),
    ];
    return { ok: true };
  }

  return apiClient
    .delete(`v1/manager/categories/${encodeURIComponent(key)}`)
    .json<{ ok: boolean }>();
}

/**
 * GET /v1/manager/products
 */
export async function getManagerProducts(): Promise<ProductsListResponse> {
  if (USE_API_MOCK) {
    await mockDelay();
    return { items: [...sessionProducts] };
  }

  return apiClient.get("v1/manager/products").json<ProductsListResponse>();
}

/**
 * POST /v1/manager/products/image — multipart file → { url }
 */
export async function uploadProductImage(
  file: File,
): Promise<{ url: string }> {
  if (USE_API_MOCK) {
    await mockDelay(200);
    const objectUrl = URL.createObjectURL(file);
    return { url: objectUrl };
  }

  const body = new FormData();
  body.append("file", file);

  return apiClient
    .post("v1/manager/products/image", { body })
    .json<{ url: string }>();
}

/**
 * POST /v1/manager/products
 */
export async function createManagerProduct(
  body: UpsertProductDto,
): Promise<Product> {
  if (USE_API_MOCK) {
    await mockDelay(300);
    if (!sessionCategories.some((c) => c.key === body.category)) {
      throw new Error("Категория не найдена");
    }
    let id = (body.id?.trim() || slugify(body.name)).slice(0, 48);
    if (sessionProducts.some((p) => p.id === id)) {
      id = `${id}-${Date.now().toString(36)}`;
    }
    const product: Product = {
      id,
      name: body.name.trim(),
      description: body.description,
      price: body.price,
      weight: body.weight,
      category: body.category,
      image: body.image,
      ...(body.popular ? { popular: true } : {}),
      ingredients: (body.ingredients ?? []).map((i) => ({
        id: i.id?.trim() || autoKey(i.name),
        name: i.name.trim(),
      })),
      extras: (body.extras ?? []).map((e) => ({
        id: e.id?.trim() || autoKey(e.name),
        name: e.name.trim(),
        price: e.price,
      })),
    };
    sessionProducts = [...sessionProducts, product];
    return product;
  }

  return apiClient
    .post("v1/manager/products", { json: body })
    .json<Product>();
}

/**
 * PUT /v1/manager/products/:id
 */
export async function updateManagerProduct(
  id: string,
  body: UpsertProductDto,
): Promise<Product> {
  if (USE_API_MOCK) {
    await mockDelay(300);
    if (!sessionCategories.some((c) => c.key === body.category)) {
      throw new Error("Категория не найдена");
    }
    const idx = sessionProducts.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Товар не найден");
    const product: Product = {
      id,
      name: body.name.trim(),
      description: body.description,
      price: body.price,
      weight: body.weight,
      category: body.category,
      image: body.image,
      ...(body.popular ? { popular: true } : {}),
      ingredients: (body.ingredients ?? []).map((i) => ({
        id: i.id?.trim() || autoKey(i.name),
        name: i.name.trim(),
      })),
      extras: (body.extras ?? []).map((e) => ({
        id: e.id?.trim() || autoKey(e.name),
        name: e.name.trim(),
        price: e.price,
      })),
    };
    sessionProducts = [
      ...sessionProducts.slice(0, idx),
      product,
      ...sessionProducts.slice(idx + 1),
    ];
    return product;
  }

  return apiClient
    .put(`v1/manager/products/${encodeURIComponent(id)}`, { json: body })
    .json<Product>();
}

/**
 * DELETE /v1/manager/products/:id
 */
export async function deleteManagerProduct(
  id: string,
): Promise<{ ok: boolean }> {
  if (USE_API_MOCK) {
    await mockDelay(200);
    const idx = sessionProducts.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Товар не найден");
    sessionProducts = [
      ...sessionProducts.slice(0, idx),
      ...sessionProducts.slice(idx + 1),
    ];
    return { ok: true };
  }

  return apiClient
    .delete(`v1/manager/products/${encodeURIComponent(id)}`)
    .json<{ ok: boolean }>();
}

/**
 * GET /v1/manager/extras
 */
export async function getManagerExtras(): Promise<ExtrasListResponse> {
  if (USE_API_MOCK) {
    await mockDelay();
    return {
      items: [...sessionExtras].sort((a, b) =>
        a.name.localeCompare(b.name, "ru"),
      ),
    };
  }

  return apiClient.get("v1/manager/extras").json<ExtrasListResponse>();
}

/**
 * POST /v1/manager/extras
 */
export async function createManagerExtra(
  body: UpsertMenuExtraDto,
): Promise<MenuExtra> {
  if (USE_API_MOCK) {
    await mockDelay(200);
    const name = body.name.trim();
    if (!name) throw new Error("Укажите название допа");
    if (Number.isNaN(body.price) || body.price < 0) {
      throw new Error("Укажите корректную цену");
    }
    let key = slugify(name);
    if (sessionExtras.some((e) => e.key === key)) {
      key = `${key}-${Date.now().toString(36)}`;
    }
    const extra: MenuExtra = {
      id: key,
      key,
      name,
      price: body.price,
    };
    sessionExtras = [...sessionExtras, extra];
    return extra;
  }

  return apiClient
    .post("v1/manager/extras", { json: body })
    .json<MenuExtra>();
}

/**
 * PUT /v1/manager/extras/:key
 */
export async function updateManagerExtra(
  key: string,
  body: UpsertMenuExtraDto,
): Promise<MenuExtra> {
  if (USE_API_MOCK) {
    await mockDelay(200);
    const idx = sessionExtras.findIndex((e) => e.key === key);
    if (idx === -1) throw new Error("Доп не найден");
    const name = body.name.trim();
    if (!name) throw new Error("Укажите название допа");
    const extra: MenuExtra = {
      id: key,
      key,
      name,
      price: body.price,
    };
    sessionExtras = [
      ...sessionExtras.slice(0, idx),
      extra,
      ...sessionExtras.slice(idx + 1),
    ];
    sessionProducts = sessionProducts.map((p) => ({
      ...p,
      extras: (p.extras ?? []).map((e) =>
        e.id === key ? { ...e, name, price: body.price } : e,
      ),
    }));
    return extra;
  }

  return apiClient
    .put(`v1/manager/extras/${encodeURIComponent(key)}`, { json: body })
    .json<MenuExtra>();
}

/**
 * DELETE /v1/manager/extras/:key
 */
export async function deleteManagerExtra(
  key: string,
): Promise<{ ok: boolean }> {
  if (USE_API_MOCK) {
    await mockDelay(200);
    const idx = sessionExtras.findIndex((e) => e.key === key);
    if (idx === -1) throw new Error("Доп не найден");
    sessionExtras = [
      ...sessionExtras.slice(0, idx),
      ...sessionExtras.slice(idx + 1),
    ];
    sessionProducts = sessionProducts.map((p) => ({
      ...p,
      extras: (p.extras ?? []).filter((e) => e.id !== key),
    }));
    return { ok: true };
  }

  return apiClient
    .delete(`v1/manager/extras/${encodeURIComponent(key)}`)
    .json<{ ok: boolean }>();
}
