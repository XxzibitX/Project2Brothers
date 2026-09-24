import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronsUpDown } from "lucide-react";

type Props<T> = {
  label: string;
  required?: boolean;
  value: T | null;
  items: T[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  search: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  error?: string;
  getKey: (item: T) => string;
  onSelect: (item: T) => void;
  renderValue: (item: T) => React.ReactNode;
  renderItem: (item: T) => React.ReactNode;
};

//
//
//
//
//

export function FormComboboxField<T>({
  label,
  required,
  value,
  items,
  open,
  onOpenChange,
  search,
  onSearchChange,
  placeholder,
  searchPlaceholder = "Поиск...",
  emptyText = "Ничего не найдено",
  disabled,
  error,
  getKey,
  onSelect,
  renderValue,
  renderItem,
}: Props<T>) {
  return (
    <Field>
      <FieldLabel>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </FieldLabel>

      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            disabled={disabled}
            className="h-auto min-h-11 w-full justify-between"
          >
            {value == null ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              renderValue(value)
            )}

            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] p-0"
        >
          <Command>
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={onSearchChange}
            />

            <CommandList className="max-h-[350px]">
              <CommandEmpty>{emptyText}</CommandEmpty>

              {items.map((item) => (
                <CommandItem
                  key={getKey(item)}
                  value={getKey(item)}
                  onSelect={() => {
                    onSelect(item);
                    onOpenChange(false);
                  }}
                >
                  {renderItem(item)}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error && (
        <FieldError className="mt-1 text-sm text-destructive">
          {error}
        </FieldError>
      )}
    </Field>
  );
}
