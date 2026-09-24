import { useMemo } from "react";

type FilterConfig<T> = {
  status?: string | undefined;
  statusAccessor?: (item: T) => string;
  isEnabled?: string | undefined;
  isEnabledAccessor?: (item: T) => boolean | string;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  dateAccessor?: (item: T) => string;
  searchQuery?: string;
  searchFields?: (item: T, context?: Record<string, unknown>) => string[];
  searchContext?: Record<string, unknown>;
};

export function useFilteredData<T>(
  data: T[] | undefined,
  config: FilterConfig<T>,
): T[] {
  const {
    status,
    statusAccessor,
    isEnabled,
    isEnabledAccessor,
    dateFrom,
    dateTo,
    dateAccessor,
    searchQuery,
    searchFields,
    searchContext,
  } = config;

  return useMemo(() => {
    if (!data) return [];
    let filtered = data;

    if (status && status !== "all" && statusAccessor) {
      filtered = filtered.filter((item) => statusAccessor(item) === status);
    }

    if (isEnabled && isEnabled !== "all" && isEnabledAccessor) {
      filtered = filtered.filter((item) => {
        const itemStatus = isEnabledAccessor(item);

        if (typeof itemStatus === "boolean") {
          const expectedStatus = isEnabled === "enabled" || isEnabled === "true";
          return itemStatus === expectedStatus;
        }
        return String(itemStatus) === isEnabled;
      });
    }

    if (dateFrom && dateAccessor) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((item) => {
        const itemDate = new Date(dateAccessor(item));
        itemDate.setHours(0, 0, 0, 0);
        return itemDate >= fromDate;
      });
    }

    if (dateTo && dateAccessor) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((item) => {
        const itemDate = new Date(dateAccessor(item));
        return itemDate <= toDate;
      });
    }

    if (searchQuery?.trim() && searchFields) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((item) => {
        const searchableFields = searchFields(item, searchContext);
        return searchableFields.join(" ").toLowerCase().includes(query);
      });
    }

    return filtered;
  }, [
    data,
    status,
    statusAccessor,
    isEnabled,
    isEnabledAccessor,
    dateFrom,
    dateTo,
    dateAccessor,
    searchQuery,
    searchFields,
    searchContext,
  ]);
}
