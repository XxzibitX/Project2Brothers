import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getProducts, type ProductsQuery } from "@/api";

export function useProducts(query: ProductsQuery = {}) {
  return useQuery({
    queryKey: ["products", query],
    queryFn: () => getProducts(query),
    // Не размонтировать сетку при смене категории — иначе страница прыгает вверх
    placeholderData: keepPreviousData,
  });
}
