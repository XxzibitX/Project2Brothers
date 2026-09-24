import { useQuery } from "@tanstack/react-query";
import { getConfig } from "@/api";

export const CONFIG_QUERY_KEY = ["config"] as const;

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function useConfig() {
  return useQuery({
    queryKey: CONFIG_QUERY_KEY,
    queryFn: getConfig,
    staleTime: 5 * 60_000,
  });
}

/** Публичные контакты кафе из GET /v1/config */
export function useCafeContacts() {
  const { data, isPending, isError } = useConfig();

  return {
    supportPhone: asTrimmedString(data?.supportPhone),
    cafeAddress: asTrimmedString(data?.cafeAddress),
    workingHours: asTrimmedString(data?.workingHours),
    isPending,
    isError,
  };
}
