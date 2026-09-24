import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

interface TableSortableHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export function TableSortableHeader<TData, TValue>({
  column,
  children,
  className,
  headerClassName,
}: TableSortableHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <TableHead className={className}>{children}</TableHead>;
  }

  const handleSort = () => {
    const currentSort = column.getIsSorted();
    if (currentSort === false) {
      column.toggleSorting(false);
    } else if (currentSort === "asc") {
      column.toggleSorting(true);
    } else {
      column.clearSorting();
    }
  };

  return (
    <TableHead className={className}>
      <button
        onClick={handleSort}
        className={cn(
          "flex w-full items-center gap-2 hover:text-foreground transition-colors",
          headerClassName,
          column.getIsSorted() && "text-foreground",
        )}
      >
        {children}
        {column.getIsSorted() === "asc" ? (
          <ArrowUp className="h-4 w-4" />
        ) : column.getIsSorted() === "desc" ? (
          <ArrowDown className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-50" />
        )}
      </button>
    </TableHead>
  );
}
