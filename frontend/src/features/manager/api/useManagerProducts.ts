import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createManagerProduct,
  deleteManagerProduct,
  getManagerProducts,
  updateManagerProduct,
  uploadProductImage,
  type UpsertProductDto,
} from "@/api";
import { useAuth } from "@/hooks/useAuth";

export const MANAGER_PRODUCTS_QUERY_KEY = ["products", "manager"] as const;

export function useManagerProducts() {
  const { isManager } = useAuth();

  return useQuery({
    queryKey: MANAGER_PRODUCTS_QUERY_KEY,
    queryFn: getManagerProducts,
    enabled: isManager,
  });
}

export function useUploadProductImage() {
  return useMutation({
    mutationFn: (file: File) => uploadProductImage(file),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpsertProductDto) => createManagerProduct(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MANAGER_PRODUCTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpsertProductDto }) =>
      updateManagerProduct(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MANAGER_PRODUCTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteManagerProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MANAGER_PRODUCTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
