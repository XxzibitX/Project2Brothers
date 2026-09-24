/** Ключ категории (динамический) */
export type ProductCategory = string;

export interface MenuCategory {
  id: string;
  key: string;
  name: string;
  sortOrder: number;
}

/** Доп из общего справочника */
export interface MenuExtra {
  id: string;
  key: string;
  name: string;
  price: number;
}

/** Ингредиент в составе — можно убрать */
export interface ProductIngredient {
  id: string;
  name: string;
}

/** Доп. опция — можно добавить за доп. цену */
export interface ProductExtra {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
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
