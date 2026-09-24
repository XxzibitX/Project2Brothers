import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCopy } from "@/shared/hooks/useCopy";

type Props = {
  id: string;
  left?: number;
  right?: number;
  className?: string;
};

export function ShortId({
  id,
  left = 8,
  right = 8,
  className,
}: Props) {
  const { copied, copy } = useCopy();

  if (!id) {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>
        —
      </span>
    );
  }

  const short =
    id.length > left + right
      ? `${id.slice(0, left)}...${id.slice(-right)}`
      : id;

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="font-mono text-xs text-muted-foreground">
        {short}
      </span>

      <button
        type="button"
        onClick={() => copy(id)}
        className="text-muted-foreground hover:text-foreground transition"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}