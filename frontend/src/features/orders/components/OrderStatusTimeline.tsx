import type { OrderStatus } from "@/api";
import { orderTimelineSteps } from "@/features/manager/constants/orderStatus";
import { cn } from "@/lib/utils";
import {
  Bike,
  ChefHat,
  CircleCheck,
  ClipboardCheck,
  Package,
  type LucideIcon,
} from "lucide-react";

type Props = {
  status: OrderStatus;
};

const stepIcons: Record<
  (typeof orderTimelineSteps)[number]["status"],
  LucideIcon
> = {
  new: ClipboardCheck,
  cooking: ChefHat,
  ready: Package,
  courier: Bike,
  done: CircleCheck,
};

export function OrderStatusTimeline({ status }: Props) {
  if (status === "cancelled") {
    return (
      <div className="rounded-md border border-chili/30 bg-chili/10 px-4 py-3 text-sm font-semibold text-chili">
        Заказ отменён
      </div>
    );
  }

  const currentIdx = orderTimelineSteps.findIndex((s) => s.status === status);
  const activeIdx = currentIdx === -1 ? 0 : currentIdx;

  return (
    <div className="w-full pt-1">
      <div className="flex items-start">
        {orderTimelineSteps.map((step, idx) => {
          const done = idx <= activeIdx;
          const current = idx === activeIdx;
          const Icon = stepIcons[step.status];
          const segmentFilled = idx < activeIdx;

          return (
            <div key={step.status} className="contents">
              <div className="relative z-10 flex w-14 shrink-0 flex-col items-center gap-2 sm:w-16">
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-full border-2 transition sm:size-9",
                    done
                      ? "border-mustard bg-mustard text-grill"
                      : "border-muted-foreground/30 bg-card text-muted-foreground",
                    current && "ring-4 ring-mustard/25",
                  )}
                >
                  <Icon className="size-3.5 sm:size-4" strokeWidth={2.25} />
                </span>
                <span
                  className={cn(
                    "text-center text-[10px] leading-tight font-semibold sm:text-xs",
                    done ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>

              {idx < orderTimelineSteps.length - 1 ? (
                <div
                  className={cn(
                    "mt-4 h-0.5 min-w-2 flex-1 self-start sm:mt-[1.125rem]",
                    segmentFilled ? "bg-mustard" : "bg-muted",
                  )}
                  aria-hidden
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
