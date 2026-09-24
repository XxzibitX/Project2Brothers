import { Banknote, CreditCard, Wallet } from "lucide-react";
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/api/orders/orders.entities";
import { cn } from "@/lib/utils";

type Props = {
  value: PaymentMethod | null;
  onChange: (next: PaymentMethod) => void;
  error?: string;
  disabled?: boolean;
};

const OPTIONS: {
  value: PaymentMethod;
  icon: typeof CreditCard;
}[] = [
  { value: "card_courier", icon: CreditCard },
  { value: "cash_courier", icon: Banknote },
];

export function PaymentMethodForm({
  value,
  onChange,
  error,
  disabled,
}: Props) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-mustard/25 text-grill">
          <Wallet className="size-4" aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Оплата</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Выберите способ оплаты
          </p>
        </div>
      </div>

      <div
        className="mt-5 grid gap-2 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Способ оплаты"
      >
        {OPTIONS.map((opt) => {
          const selected = value === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition",
                selected
                  ? "border-mustard bg-mustard/15 text-foreground"
                  : "border-border bg-background hover:bg-muted/60",
                disabled && "opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-md",
                  selected ? "bg-mustard/30 text-grill" : "bg-muted text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="text-sm font-semibold">
                {PAYMENT_METHOD_LABELS[opt.value]}
              </span>
            </button>
          );
        })}
      </div>

      {error ? <p className="mt-2 text-xs text-chili">{error}</p> : null}
    </section>
  );
}
