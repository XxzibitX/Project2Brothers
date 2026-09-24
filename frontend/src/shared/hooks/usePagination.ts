import type { PaginationState } from "@tanstack/react-table";

//
//
//
//
//

export function usePagination({
  total,
  pagination,
}: {
  total: number;
  pagination: PaginationState;
}) {
  const pageCount = Math.ceil(total / pagination.pageSize);

  const hasNextPage = pagination.pageIndex < pageCount - 1;

  return {
    pageCount,
    hasNextPage,
  };
}