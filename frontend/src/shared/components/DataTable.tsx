import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSortableHeader } from "@/components/ui/table-sortable-header";
import { flexRender, type Table as ReactTable } from "@tanstack/react-table";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  getReactTableCellKey,
  getReactTableRowKey,
} from "@/shared/table/reactTableKeys";

type Props<T> = {
  table: ReactTable<T>;
  isFetching?: boolean;
  emptyContent?: ReactNode;
  emptyClassName?: string;
  rowClassName?: string;
};

export function DataTable<T>({
  table,
  isFetching = false,
  emptyContent = "Нет данных",
  emptyClassName,
  rowClassName,
}: Props<T>) {
  return (
    <>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableSortableHeader
                  key={header.id}
                  column={header.column}
                  className={
                    (
                      header.column.columnDef.meta as
                        | {
                            className?: string;
                            headerClassName?: string;
                          }
                        | undefined
                    )?.className
                  }
                  headerClassName={
                    (
                      header.column.columnDef.meta as
                        | {
                            className?: string;
                            headerClassName?: string;
                          }
                        | undefined
                    )?.headerClassName
                  }
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableSortableHeader>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={table.getVisibleLeafColumns().length}
                className={cn(
                  "text-center text-muted-foreground",
                  emptyClassName,
                )}
              >
                {emptyContent}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={getReactTableRowKey(row)} className={rowClassName}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={getReactTableCellKey(row, cell.column.id)}
                    className={
                      (
                        cell.column.columnDef.meta as
                          | { className?: string }
                          | undefined
                      )?.className
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {isFetching && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-sm backdrop-blur-xs">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      )}
    </>
  );
}
