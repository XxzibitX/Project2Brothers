import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createManagerCategory,
  deleteManagerCategory,
  getCategories,
  type CreateCategoryDto,
} from "@/api";
import { useAuth } from "@/hooks/useAuth";

export const CATEGORIES_QUERY_KEY = ["categories"] as const;

export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: getCategories,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { isManager } = useAuth();

  return useMutation({
    mutationFn: (body: CreateCategoryDto) => {
      if (!isManager) throw new Error("Нет доступа");
      return createManagerCategory(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { isManager } = useAuth();

  return useMutation({
    mutationFn: (key: string) => {
      if (!isManager) throw new Error("Нет доступа");
      return deleteManagerCategory(key);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
}
