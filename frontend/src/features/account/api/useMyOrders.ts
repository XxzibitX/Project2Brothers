import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createOrder, getMyOrders, type CreateOrderDto } from "@/api";
import { useAuth } from "@/hooks/useAuth";
import { isTerminalOrderStatus } from "@/features/manager/constants/orderStatus";

const ORDERS_LIST_POLL_MS = 5_000;

export function useMyOrders() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["orders", "mine"],
    queryFn: () => getMyOrders(),
    enabled: isAuthenticated,
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      const hasActive = items.some((o) => !isTerminalOrderStatus(o.status));
      return hasActive ? ORDERS_LIST_POLL_MS : false;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateOrderDto) => createOrder(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
