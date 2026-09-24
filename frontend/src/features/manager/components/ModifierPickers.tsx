import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ModifierOption = {
  id: string;
  name: string;
  price?: number;
};

function autoId(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return `${slug || "item"}-${Math.random().toString(36).slice(2, 8)}`;
}

type IngredientPickerProps = {
  label: string;
  value: ModifierOption[];
  options: ModifierOption[];
  onChange: (next: ModifierOption[]) => void;
};

export function IngredientPicker({
  label,
  value,
  options,
  onChange,
}: IngredientPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedIds = useMemo(() => new Set(value.map((v) => v.id)), [value]);

  const available = useMemo(() => {
    const q = search.trim().toLowerCase();
    return options.filter((o) => {
      if (selectedIds.has(o.id)) return false;
      if (!q) return true;
      return o.name.toLowerCase().includes(q);
    });
  }, [options, search, selectedIds]);

  const canCreate =
    search.trim().length > 0 &&
    !options.some(
      (o) => o.name.toLowerCase() === search.trim().toLowerCase(),
    ) &&
    !value.some((v) => v.name.toLowerCase() === search.trim().toLowerCase());

  const add = (item: ModifierOption) => {
    if (selectedIds.has(item.id)) return;
    onChange([...value, item]);
    setSearch("");
    setOpen(false);
  };

  const create = () => {
    const name = search.trim();
    if (!name) return;
    add({ id: autoId(name), name });
  };

  const remove = (id: string) => {
    onChange(value.filter((v) => v.id !== id));
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <span>{item.name}</span>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-chili"
                aria-label={`Убрать ${item.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <span className="text-muted-foreground">Добавить ингредиент…</span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="z-[60] w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Поиск или новое название…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>Ничего не найдено</CommandEmpty>
              {canCreate && (
                <CommandGroup>
                  <CommandItem onSelect={create} value={`create-${search}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Создать «{search.trim()}»
                  </CommandItem>
                </CommandGroup>
              )}
              <CommandGroup>
                {available.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => add(item)}
                  >
                    <Check className="mr-2 h-4 w-4 opacity-0" />
                    {item.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

type ExtraPickerProps = {
  label: string;
  value: Array<ModifierOption & { price: number }>;
  options: Array<ModifierOption & { price: number }>;
  onChange: (next: Array<ModifierOption & { price: number }>) => void;
  /** Если задан — новый доп сохраняется в справочник */
  onCreateNew?: (
    name: string,
    price: number,
  ) => Promise<ModifierOption & { price: number }>;
  hint?: string;
};

export function ExtraPicker({
  label,
  value,
  options,
  onChange,
  onCreateNew,
  hint,
}: ExtraPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [newPrice, setNewPrice] = useState("50");
  const [creating, setCreating] = useState(false);

  const selectedIds = useMemo(() => new Set(value.map((v) => v.id)), [value]);

  const available = useMemo(() => {
    const q = search.trim().toLowerCase();
    return options.filter((o) => {
      if (selectedIds.has(o.id)) return false;
      if (!q) return true;
      return o.name.toLowerCase().includes(q);
    });
  }, [options, search, selectedIds]);

  const canCreate =
    search.trim().length > 0 &&
    !options.some(
      (o) => o.name.toLowerCase() === search.trim().toLowerCase(),
    ) &&
    !value.some((v) => v.name.toLowerCase() === search.trim().toLowerCase());

  const add = (item: ModifierOption & { price: number }) => {
    if (selectedIds.has(item.id)) return;
    onChange([...value, item]);
    setSearch("");
    setOpen(false);
  };

  const create = async () => {
    const name = search.trim();
    const price = Number(newPrice);
    if (!name || Number.isNaN(price) || price < 0) return;
    if (onCreateNew) {
      setCreating(true);
      try {
        const created = await onCreateNew(name, price);
        add(created);
      } finally {
        setCreating(false);
      }
      return;
    }
    add({ id: autoId(name), name, price });
  };

  const remove = (id: string) => {
    onChange(value.filter((v) => v.id !== id));
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
              <span className="tabular-nums text-muted-foreground">
                +{item.price} ₽
              </span>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-chili"
                aria-label={`Убрать ${item.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm",
            )}
          >
            <span className="text-muted-foreground">Добавить доп…</span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="z-[60] w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Поиск или новое название…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>Ничего не найдено</CommandEmpty>
              {canCreate && (
                <CommandGroup>
                  <div className="flex items-center gap-2 border-b border-border px-2 py-2">
                    <input
                      type="number"
                      min={0}
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-20 rounded-md border border-border px-2 py-1 text-sm"
                      placeholder="Цена"
                    />
                    <span className="text-xs text-muted-foreground">₽</span>
                  </div>
                  <CommandItem
                    onSelect={() => {
                      void create();
                    }}
                    value={`create-${search}`}
                    disabled={creating}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {creating ? "Создаём…" : `Создать «${search.trim()}»`}
                  </CommandItem>
                </CommandGroup>
              )}
              <CommandGroup>
                {available.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => add(item)}
                  >
                    <span className="flex-1">{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      +{item.price} ₽
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
