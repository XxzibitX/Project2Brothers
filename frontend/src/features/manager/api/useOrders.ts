import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getManagerArchiveMonths,
  getManagerArchiveOrders,
  getManagerOrders,
  patchManagerOrderStatus,
  type ArchiveOrdersQuery,
  type OrdersQuery,
  type OrderStatus,
} from "@/api";
import { useAuth } from "@/hooks/useAuth";

export function useOrders(query: OrdersQuery = {}, enabled = true) {
  const { isManager } = useAuth();

  return useQuery({
    queryKey: ["orders", "manager", query],
    queryFn: () => getManagerOrders(query),
    enabled: isManager && enabled,
    refetchInterval: query.bucket === "active" ? 15_000 : 60_000,
  });
}

export function useArchiveMonths(enabled = true) {
  const { isManager } = useAuth();

  return useQuery({
    queryKey: ["orders", "manager", "archive", "months"],
    queryFn: () => getManagerArchiveMonths(),
    enabled: isManager && enabled,
    staleTime: 60_000,
  });
}

export function useArchiveOrders(
  query: ArchiveOrdersQuery | null,
  enabled = true,
) {
  const { isManager } = useAuth();

  return useQuery({
    queryKey: ["orders", "manager", "archive", query],
    queryFn: () => getManagerArchiveOrders(query!),
    enabled: isManager && enabled && query != null,
  });
}

export function usePatchOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      patchManagerOrderStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
