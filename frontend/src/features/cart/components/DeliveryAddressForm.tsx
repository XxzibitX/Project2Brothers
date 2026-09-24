import { useEffect, useId, useRef, useState } from "react";
import { MapPin, Home } from "lucide-react";
import { suggestAddress } from "@/api/address/address.api";
import type { AddressSuggestion } from "@/api/address/address.entities";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  emptyDeliveryAddress,
  formatDeliveryAddress,
  normalizeApartmentInput,
  normalizeEntranceInput,
  normalizeHouseInput,
  type DeliveryAddressErrors,
  type DeliveryAddressInput,
} from "@/features/cart/lib/deliveryAddress";
import { cn } from "@/lib/utils";

type Props = {
  value: DeliveryAddressInput;
  onChange: (next: DeliveryAddressInput) => void;
  errors?: DeliveryAddressErrors;
  disabled?: boolean;
};

export function DeliveryAddressForm({
  value,
  onChange,
  errors,
  disabled,
}: Props) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  useEffect(() => {
    const q = value.street.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setSuggestError(null);
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const items = await suggestAddress({ query: q, count: 7 });
        setSuggestions(items);
        setSuggestError(null);
        setOpen(true);
      } catch (err) {
        setSuggestions([]);
        setSuggestError(
          err instanceof Error
            ? err.message
            : "Не удалось загрузить подсказки",
        );
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => window.clearTimeout(timer);
  }, [value.street]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const patch = (partial: Partial<DeliveryAddressInput>) => {
    onChange({ ...value, ...partial });
  };

  const applySuggestion = (item: AddressSuggestion) => {
    onChange({
      ...value,
      street: item.street,
      house: item.house ? normalizeHouseInput(item.house) : value.house,
    });
    setOpen(false);
    setSuggestions([]);
  };

  const preview = formatDeliveryAddress(value);

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-mustard/25 text-grill">
          <MapPin className="size-4" aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Адрес доставки</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Начните вводить улицу — подставим адрес из подсказок
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div ref={wrapRef} className="relative">
          <Label htmlFor={`${listId}-street`} className="text-sm font-medium">
            Улица
          </Label>
          <Input
            id={`${listId}-street`}
            value={value.street}
            disabled={disabled}
            autoComplete="street-address"
            placeholder="Например, Красная"
            aria-invalid={Boolean(errors?.street)}
            aria-autocomplete="list"
            aria-controls={`${listId}-list`}
            aria-expanded={open && suggestions.length > 0}
            className="mt-1.5 h-10"
            onChange={(e) => {
              patch({ street: e.target.value });
              setOpen(true);
            }}
            onFocus={() => {
              if (suggestions.length) setOpen(true);
            }}
          />
          {errors?.street && (
            <p className="mt-1 text-xs text-chili">{errors.street}</p>
          )}
          {suggestError && !errors?.street && (
            <p className="mt-1 text-xs text-muted-foreground">{suggestError}</p>
          )}
          {loading && (
            <p className="mt-1 text-xs text-muted-foreground">Ищем адрес…</p>
          )}

          {open && suggestions.length > 0 && (
            <ul
              id={`${listId}-list`}
              role="listbox"
              className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-card py-1 text-card-foreground shadow-md"
            >
              {suggestions.map((item) => (
                <li key={item.unrestrictedValue + item.value}>
                  <button
                    type="button"
                    role="option"
                    className="flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted/70"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applySuggestion(item)}
                  >
                    <span className="font-medium">{item.value}</span>
                    {item.city || item.settlement ? (
                      <span className="text-xs text-muted-foreground">
                        {[item.city, item.settlement].filter(Boolean).join(", ")}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor={`${listId}-house`} className="text-sm font-medium">
              Дом
            </Label>
            <Input
              id={`${listId}-house`}
              value={value.house}
              disabled={disabled}
              placeholder="10"
              aria-invalid={Boolean(errors?.house)}
              className="mt-1.5 h-10"
              onChange={(e) => patch({ house: e.target.value })}
              onBlur={() =>
                patch({ house: normalizeHouseInput(value.house) })
              }
            />
            {errors?.house && (
              <p className="mt-1 text-xs text-chili">{errors.house}</p>
            )}
          </div>

          <div
            className={cn(value.isPrivateHouse && "opacity-40")}
          >
            <Label
              htmlFor={`${listId}-entrance`}
              className="text-sm font-medium"
            >
              Подъезд
            </Label>
            <Input
              id={`${listId}-entrance`}
              value={value.entrance}
              disabled={disabled || value.isPrivateHouse}
              placeholder="2"
              className="mt-1.5 h-10"
              onChange={(e) => patch({ entrance: e.target.value })}
              onBlur={() =>
                patch({ entrance: normalizeEntranceInput(value.entrance) })
              }
            />
          </div>

          <div
            className={cn(
              "col-span-2 sm:col-span-1",
              value.isPrivateHouse && "opacity-40",
            )}
          >
            <Label
              htmlFor={`${listId}-apartment`}
              className="text-sm font-medium"
            >
              Квартира
            </Label>
            <Input
              id={`${listId}-apartment`}
              value={value.apartment}
              disabled={disabled || value.isPrivateHouse}
              placeholder="45"
              aria-invalid={Boolean(errors?.apartment)}
              className="mt-1.5 h-10"
              onChange={(e) => patch({ apartment: e.target.value })}
              onBlur={() =>
                patch({
                  apartment: normalizeApartmentInput(value.apartment),
                })
              }
            />
            {errors?.apartment && (
              <p className="mt-1 text-xs text-chili">{errors.apartment}</p>
            )}
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          <Checkbox
            checked={value.isPrivateHouse}
            disabled={disabled}
            onCheckedChange={(checked) =>
              patch({
                isPrivateHouse: checked === true,
                ...(checked === true
                  ? { apartment: "", entrance: "" }
                  : {}),
              })
            }
          />
          <Home className="size-4 text-muted-foreground" aria-hidden />
          <span className="text-sm font-medium">Частный дом</span>
        </label>

        {preview ? (
          <p className="rounded-lg bg-mustard/15 px-3 py-2 text-sm text-grill">
            <span className="font-medium">Доставим: </span>
            {preview}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export { emptyDeliveryAddress };
