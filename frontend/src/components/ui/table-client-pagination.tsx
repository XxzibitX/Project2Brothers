import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import type { Table as TanStackTable } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { Input } from "./input";
import { useIsMobile } from "@/hooks/use-mobile";

type Props<TData> = {
  table: TanStackTable<TData>;
  pageSizeOptions?: number[];
};

//
//
//
//
//

export function TableClientPagination<TData>({
  table,
  pageSizeOptions = [5, 10, 20, 50, 100],
}: Props<TData>) {
  const isMobile = useIsMobile();
  const STORAGE_KEY = "table-page-size";

  const [savedPageSize, setSavedPageSize] = useState(() => {
    if (typeof window === "undefined") {
      return table.getState().pagination.pageSize;
    }

    return Number(
      localStorage.getItem(STORAGE_KEY) ?? table.getState().pagination.pageSize,
    );
  });

  useEffect(() => {
    table.setPageSize(savedPageSize);
  }, [savedPageSize, table]);

  const currentPage = table.getState().pagination.pageIndex + 1;

  const totalPages = table.getPageCount();

  const [pageInput, setPageInput] = useState(String(currentPage));

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const goToPage = () => {
    const value = Number(pageInput);

    if (Number.isNaN(value)) {
      return;
    }

    const page = Math.min(Math.max(value, 1), totalPages);

    table.setPageIndex(page - 1);
  };

  return (
    <>
      <div className="h-px w-full bg-border" />

      <div className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
        {!isMobile && (
          <div>
            <p className="text-sm text-muted-foreground">
              Показано: {table.getRowModel().rows.length}
            </p>

            <p className="text-sm text-muted-foreground">
              Всего: {table.getPrePaginationRowModel().rows.length}
            </p>
          </div>
        )}

        <Pagination className="mx-auto w-auto order-2 md:order-none">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  table.previousPage();
                }}
                className={
                  !table.getCanPreviousPage()
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            <PaginationItem>
              <Input
                type="number"
                min={1}
                max={totalPages}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;

                  e.preventDefault();
                  goToPage();
                }}
                className="!h-8 !w-16 text-center"
              />
            </PaginationItem>

            <PaginationItem>
              <span className="text-sm px-1">из</span>
            </PaginationItem>

            <PaginationItem>
              <Input
                value={String(totalPages)}
                disabled
                className="!h-8 !w-16 text-center"
              />
            </PaginationItem>

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  table.nextPage();
                }}
                className={
                  !table.getCanNextPage()
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        <Field
          orientation="horizontal"
          className="
            w-fit
            justify-self-center
            md:justify-self-end
          "
        >
          <FieldLabel>Кол-во строк</FieldLabel>
          <Select
            value={String(savedPageSize)}
            onValueChange={(value) => {
              const size = Number(value);

              setSavedPageSize(size);

              localStorage.setItem(STORAGE_KEY, String(size));

              table.setPageSize(size);

              table.setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </div>
    </>
  );
}
