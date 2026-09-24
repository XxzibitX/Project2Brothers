import { useQuery } from "@tanstack/react-query";
import { getOrderById } from "@/api";
import { useAuth } from "@/hooks/useAuth";
import { isTerminalOrderStatus } from "@/features/manager/constants/orderStatus";

/** Как часто опрашивать активный заказ (мс) */
const ORDER_POLL_MS = 4_000;

export function useOrder(id: string | undefined) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["orders", "detail", id],
    queryFn: () => getOrderById(id!),
    enabled: isAuthenticated && !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status || isTerminalOrderStatus(status)) return false;
      return ORDER_POLL_MS;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
