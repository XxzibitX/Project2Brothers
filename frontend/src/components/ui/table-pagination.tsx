import { Field, FieldLabel } from "@/components/ui/field";
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
import { useEffect, useState } from "react";
import type { Table as TanStackTable } from "@tanstack/react-table";
import { Input } from "./input";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props<TData> {
  table: TanStackTable<TData>;
  pageSizeOptions?: number[];
  total?: number;
  displayPageIndex?: number;
}

//
//
//
//
//

export function TablePagination<TData>({
  table,
  pageSizeOptions = [5, 10, 20, 30, 50],
  total,
}: Props<TData>) {
  const isMobile = useIsMobile();
  const STORAGE_KEY = "table-page-size";

  const [savedPageSize, setSavedPageSize] = useState(() => {
    if (typeof window === "undefined") {
      return table.getState().pagination.pageSize;
    }

    const stored = localStorage.getItem(STORAGE_KEY);

    return stored ? Number(stored) : table.getState().pagination.pageSize;
  });

  useEffect(() => {
    table.setPageSize(savedPageSize);
  }, [savedPageSize, table]);

  const currentPage = table.getState().pagination.pageIndex + 1;

  const [pageInput, setPageInput] = useState(String(currentPage));

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const goToPage = () => {
    const value = Number(pageInput);

    if (Number.isNaN(value) || pageInput.trim() === "") {
      setPageInput(String(currentPage));
      return;
    }

    const page = Math.min(Math.max(value, 1), totalPages ?? 0);

    table.setPageIndex(page - 1);
  };

  const pageSize = table.getState().pagination.pageSize;

  const totalPages = total ? Math.ceil(total / pageSize) : table.getPageCount();

  return (
    <>
      <div className="h-px w-full bg-border" />
      <div className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
        {!isMobile && (
          <div className="justify-self-start">
            <p className="text-center text-sm text-muted-foreground sm:text-left">
              Показано: {table.getRowModel().rows.length}
            </p>
            {total && (
              <p className="text-center text-sm text-muted-foreground sm:text-left">
                Всего: {total}
              </p>
            )}
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
              {/* <Button
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  table.previousPage();
                }}
                className={
                  !table.getCanPreviousPage()
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              >
                <ChevronLeft />
                Предыдущая
              </Button> */}
            </PaginationItem>

            <PaginationItem className="px-1">
              <input
                type="number"
                min={1}
                max={total}
                value={pageInput}
                onChange={(e) => {
                  setPageInput(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") {
                    return;
                  }

                  e.preventDefault();

                  goToPage();
                }}
                className="
                  h-9
                  w-18
                  rounded-md
                  border
                  border-input
                  bg-background/30
                  px-2
                  text-center
                  text-sm
                "
              />
              {total && (
                <>
                  <span className="text-sm px-2">из</span>
                  <Input
                    type="number"
                    value={totalPages}
                    disabled
                    className="
                      !h-9
                      !w-18
                      rounded-md
                      border
                      border-input
                      px-2
                      text-center
                      text-sm
                    "
                  />
                </>
              )}
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
              {/* <Button
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  table.nextPage();
                }}
                className={
                  !table.getCanNextPage()
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              >
                Следующая
                <ChevronRight />
              </Button> */}
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
          <FieldLabel htmlFor="select-rows-per-page">Кол-во строк</FieldLabel>
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
            <SelectTrigger className="w-20" id="select-rows-per-page">
              <SelectValue />
            </SelectTrigger>

            <SelectContent align="start">
              <SelectGroup>
                {pageSizeOptions.map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value}
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
