import { type Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Props<TData> = {
  table?: Table<TData>;
  className?: string;
  isMobile?: boolean;
};

export function ColumnVisibilityDropdown<TData>({
  table,
  className,
  isMobile = false
}: Props<TData>) {
  if (!table) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn(className, isMobile ? "w-full text-lg h-10 py-2" : "text-sm")}>
          <span>Скрыть колонки</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {table.getAllLeafColumns().map((column) => {
          if (!column.getCanHide()) return null;

          return (
            <DropdownMenuItem
              key={column.id}
              onSelect={(e) => e.preventDefault()}
              className="flex items-center gap-2 text-xl md:text-sm"
              onClick={(e) => {
                e.preventDefault();
                column.toggleVisibility(!column.getIsVisible());
              }}
            >
              <Checkbox
                checked={column.getIsVisible()}
                onCheckedChange={(value) => {
                  column.toggleVisibility(value === true);
                }}
              />

              <span>
                {(column.columnDef.meta as { label?: string } | undefined)
                  ?.label || column.id}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
