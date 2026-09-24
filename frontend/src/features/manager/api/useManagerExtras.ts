import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createManagerExtra,
  deleteManagerExtra,
  getManagerExtras,
  updateManagerExtra,
  type UpsertMenuExtraDto,
} from "@/api";
import { useAuth } from "@/hooks/useAuth";
import { MANAGER_PRODUCTS_QUERY_KEY } from "@/features/manager/api/useManagerProducts";

export const MANAGER_EXTRAS_QUERY_KEY = ["extras", "manager"] as const;

export function useManagerExtras() {
  const { isManager } = useAuth();

  return useQuery({
    queryKey: MANAGER_EXTRAS_QUERY_KEY,
    queryFn: getManagerExtras,
    enabled: isManager,
  });
}

export function useCreateExtra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpsertMenuExtraDto) => createManagerExtra(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MANAGER_EXTRAS_QUERY_KEY });
    },
  });
}

export function useUpdateExtra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, body }: { key: string; body: UpsertMenuExtraDto }) =>
      updateManagerExtra(key, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MANAGER_EXTRAS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MANAGER_PRODUCTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteExtra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (key: string) => deleteManagerExtra(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MANAGER_EXTRAS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MANAGER_PRODUCTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
