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
import { Check, ChevronsUpDown } from "lucide-react";

type Props<T> = {
  label: string;
  required?: boolean;
  items: T[];
  values: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  search: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
  getKey: (item: T) => string;
  getBadge: (item: T) => React.ReactNode;
  renderItem: (item: T) => React.ReactNode;
  onChange: (ids: string[]) => void;
};

//
//
//
//
//

export function FormMultiComboboxField<T>({
  label,
  required,
  items,
  values,
  open,
  onOpenChange,
  search,
  onSearchChange,
  placeholder,
  searchPlaceholder = "Поиск...",
  emptyText = "Ничего не найдено",
  disabled,
  error,
  hint,
  getKey,
  getBadge,
  renderItem,
  onChange,
}: Props<T>) {
  const toggle = (id: string) => {
    if (values.includes(id)) {
      onChange(values.filter((value) => value !== id));
    } else {
      onChange([...values, id]);
    }
  };

  const selectedItems = items.filter((item) =>
    values.includes(getKey(item)),
  );

  return (
    <Field>
      <FieldLabel>
        {label}
        {required && (
          <span className="ml-1 text-destructive">*</span>
        )}
      </FieldLabel>

      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            disabled={disabled}
            className="h-auto min-h-11 w-full justify-between"
          >
            {selectedItems.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selectedItems.map((item) => (
                  <div
                    key={getKey(item)}
                    className="rounded bg-muted px-2 py-1 text-xs"
                  >
                    {getBadge(item)}
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">
                {placeholder}
              </span>
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

              {items.map((item) => {
                const id = getKey(item);
                const selected = values.includes(id);

                return (
                  <CommandItem
                    key={id}
                    value={id}
                    onSelect={() => toggle(id)}
                    className="items-start py-3"
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        selected ? "opacity-100" : "opacity-0"
                      }`}
                    />

                    <div className="flex-1">
                      {renderItem(item)}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {hint && (
        <p className="mt-1 text-xs text-muted-foreground">
          {hint}
        </p>
      )}

      {error && (
        <FieldError className="mt-1 text-sm text-destructive">
          {error}
        </FieldError>
      )}
    </Field>
  );
}