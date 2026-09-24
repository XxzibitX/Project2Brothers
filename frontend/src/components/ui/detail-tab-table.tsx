import {
  flexRender,
  type RowData,
  type Table as TanstackTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSortableHeader } from "@/components/ui/table-sortable-header";
import { TableClientPagination } from "./table-client-pagination";
import {
  getReactTableCellKey,
  getReactTableRowKey,
} from "@/shared/table/reactTableKeys";

type DetailTabTableProps<TData extends RowData> = {
  isLoading: boolean;
  loadingText: string;
  emptyText: string;
  hasRows: boolean;
  table: TanstackTable<TData>;
  className?: string;
};

//
//
//
//
//

export function DetailTabTable<TData extends RowData>({
  isLoading,
  loadingText,
  emptyText,
  hasRows,
  table,
  className = "pt-5",
}: DetailTabTableProps<TData>) {
  return (
    <div className={className}>
      {isLoading ? (
        <div className="py-6 text-sm text-muted-foreground">{loadingText}</div>
      ) : (
        <>
        {!hasRows ? (
            <div className="flex items-center justify-center py-30 text-muted-foreground">
              Нет данных
            </div>
          ) : (
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
                            | { className?: string }
                            | undefined
                        )?.className
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
              {!hasRows ? (
                <TableRow>
                  <TableCell
                    colSpan={table.getVisibleLeafColumns().length}
                    className="py-8 text-center text-muted-foreground"
                  >
                    {emptyText}
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={getReactTableRowKey(row)}>
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
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          )}
          {hasRows ? (
            <TableClientPagination
              table={table}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
