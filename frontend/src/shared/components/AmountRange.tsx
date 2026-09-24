import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  value?: [number, number];
  onChange?: (value: [number, number]) => void;
  resetKey?: number;
  isMobile?: boolean;
  className?: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function parseNumber(val: string): number | null {
  const num = Number(val.replace(/\s/g, "").replace(",", "."));
  return Number.isNaN(num) ? null : num;
}

export function AmountRange({
  value = [0, 0],
  onChange,
  resetKey,
  isMobile,
  className,
}: Props) {
  const [internal, setInternal] = React.useState<[string, string]>(["", ""]);

  React.useEffect(() => {
    setInternal([
      value[0] ? formatNumber(value[0]) : "",
      value[1] ? formatNumber(value[1]) : "",
    ]);
  }, [resetKey, value]);

  const commit = (next: [string, string]) => {
    setInternal(next);
    const from = parseNumber(next[0]) ?? 0;
    const to = parseNumber(next[1]) ?? 0;
    onChange?.([from, to]);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        isMobile && "w-full flex-col items-stretch",
        className,
      )}
    >
      <Input
        inputMode="decimal"
        placeholder="От"
        value={internal[0]}
        onChange={(e) => commit([e.target.value, internal[1]])}
      />
      <span className="text-muted-foreground">—</span>
      <Input
        inputMode="decimal"
        placeholder="До"
        value={internal[1]}
        onChange={(e) => commit([internal[0], e.target.value])}
      />
    </div>
  );
}
