import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SelectOption<T extends string> = {
  value: T;
  label: string;
};

type SelectFilterProps<T extends string> = {
  options: SelectOption<T>[];
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  placeholder?: string;
  label?: string;
  allValue?: string;
  id?: string;
  triggerClassName?: string;
  isMobile?: boolean;
};

export function SelectFilter<T extends string>({
  options,
  value,
  onChange,
  placeholder = "Все",
  label = "",
  allValue = "all",
  id = "selectFilter",
  triggerClassName = "w-[220px]",
  isMobile = false,
}: SelectFilterProps<T>) {
  return (
    <div className="flex items-center gap-2">
      {label && (
        <Label
          htmlFor={id}
          className="text-sm whitespace-nowrap text-muted-foreground"
        >
          {label}
        </Label>
      )}

      <Select
        value={value ?? allValue}
        onValueChange={(selectedValue) => {
          if (selectedValue === allValue) {
            onChange(undefined);
          } else {
            onChange(selectedValue as T);
          }
        }}
      >
        <SelectTrigger
          id={id}
          // className={cn(
          //   "h-8 sm:h-9",
          //   triggerClassName,
          // )}
          className={cn(
            "justify-between h-9",
            isMobile ? "w-full h-12 text-lg" : triggerClassName,
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value={allValue}>{placeholder}</SelectItem>

          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
