import type { Dispatch, SetStateAction } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { textSize } from "@/constants/adaptive/textSize";
import { roendedSize } from "@/constants/adaptive/roundedSize";

type Props<T> = {
  label: string;
  hint?: string;
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  search: string;
  onSearchChange: Dispatch<SetStateAction<string>>;
  searchPlaceholder?: string;
  items: T[];
  selectedIds: number[];
  getId: (item: T) => number;
  getLabel: (item: T) => string;
  getRightLabel?: (item: T) => string | undefined;
  onToggle: (id: number) => void;
  disabled?: boolean;
  emptyText?: string;
};

//
//
//
//
//

export function FormCheckboxListField<T>({
  label,
  hint,
  open,
  onOpenChange,
  search,
  onSearchChange,
  searchPlaceholder = "Поиск...",
  items,
  selectedIds,
  getId,
  getLabel,
  getRightLabel,
  onToggle,
  disabled = false,
  emptyText = "Ничего не найдено",
}: Props<T>) {
  return (
    <Field>
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          <div className="flex cursor-pointer items-center justify-between">
            <div className="flex items-center gap-2">
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  open && "rotate-180",
                )}
              />

              <FieldLabel className={cn(textSize.md)}>{label}</FieldLabel>
            </div>

            {selectedIds.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {selectedIds.length}
              </span>
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-2 space-y-2">
          {hint && <p className={cn(textSize.sm, "text-muted-foreground")}>{hint}</p>}

          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className={cn(
              textSize.md,
              roendedSize.input,
              "h-10 sm:h-9 text-lg",
            )}
          />

          {items.length > 0 ? (
            <div className="max-h-48 overflow-y-auto rounded-md border p-3 space-y-2">
              {items.map((item) => {
                const id = getId(item);

                return (
                  <label
                    key={id}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <Checkbox
                      checked={selectedIds.includes(id)}
                      onCheckedChange={() => onToggle(id)}
                      disabled={disabled}
                    />

                    <span className="text-lg sm:text-sm">{getLabel(item)}</span>

                    {getRightLabel && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {getRightLabel(item)}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="mt-1 text-muted-foreground">{emptyText}</div>
          )}

          <p className="text-sm sm:text-xs text-muted-foreground">
            Выбрано: {selectedIds.length}
          </p>
        </CollapsibleContent>
      </Collapsible>
    </Field>
  );
}
