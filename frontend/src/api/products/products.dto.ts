import type {
  MenuCategory,
  MenuExtra,
  Product,
  ProductCategory,
  ProductExtra,
  ProductIngredient,
} from "./products.entities";

/** GET /v1/products */
export interface ProductsQuery {
  category?: ProductCategory;
}

/** GET /v1/products → body */
export interface ProductsListResponse {
  items: Product[];
}

/** GET /v1/categories */
export interface CategoriesListResponse {
  items: MenuCategory[];
}

/** POST /v1/manager/categories */
export interface CreateCategoryDto {
  name: string;
}

/** GET /v1/manager/extras */
export interface ExtrasListResponse {
  items: MenuExtra[];
}

/** POST|PUT /v1/manager/extras */
export interface UpsertMenuExtraDto {
  name: string;
  price: number;
}

/** POST|PUT /v1/manager/products */
export interface UpsertProductDto {
  id?: string;
  name: string;
  description: string;
  price: number;
  weight: string;
  category: ProductCategory;
  image: string;
  popular?: boolean;
  ingredients?: ProductIngredient[];
  extras?: ProductExtra[];
}
