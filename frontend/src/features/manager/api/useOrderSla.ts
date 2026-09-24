import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getManagerOrderSla,
  updateManagerOrderSla,
  type OrderSlaConfig,
} from "@/api";
import { useAuth } from "@/hooks/useAuth";
import { CONFIG_QUERY_KEY } from "@/hooks/useConfig";

export const ORDER_SLA_QUERY_KEY = ["config", "order-sla"] as const;

export function useOrderSla() {
  const { isManager } = useAuth();

  return useQuery({
    queryKey: ORDER_SLA_QUERY_KEY,
    queryFn: getManagerOrderSla,
    enabled: isManager,
    staleTime: 60_000,
  });
}

export function useUpdateOrderSla() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: OrderSlaConfig) => updateManagerOrderSla(body),
    onSuccess: (data) => {
      queryClient.setQueryData(ORDER_SLA_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY });
    },
  });
}
