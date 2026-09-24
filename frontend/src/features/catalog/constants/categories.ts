import type { ProductCategory } from "@/api";

export const categoryLabels: Record<ProductCategory, string> = {
  shawarma: "Шаурма",
  sides: "Гарниры",
  drinks: "Напитки",
  sauces: "Соусы",
};

export const catalogCategories: Array<ProductCategory | "all"> = [
  "all",
  "shawarma",
  "sides",
  "drinks",
  "sauces",
];
