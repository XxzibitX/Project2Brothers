import { Phone } from "lucide-react";
import { formatPhoneDisplay, toTelHref } from "@/shared/lib/phone";
import { cn } from "@/lib/utils";

type Props = {
  phone: string;
  className?: string;
};

export function PhoneLink({ phone, className }: Props) {
  const href = toTelHref(phone);
  const label = formatPhoneDisplay(phone);

  if (!href) {
    return (
      <span className={cn("text-sm text-muted-foreground", className)}>
        нет телефона
      </span>
    );
  }

  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-background/80 px-2 py-0.5",
        "text-sm tabular-nums tracking-wide text-foreground",
        "transition hover:border-grill/40 hover:bg-mustard/15",
        className,
      )}
      title={`Позвонить ${label}`}
    >
      <Phone className="size-3.5 shrink-0 text-grill" aria-hidden />
      <span>{label}</span>
    </a>
  );
}
