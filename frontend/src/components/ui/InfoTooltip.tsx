import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Variant = "default" | "success" | "warning" | "danger";

type Props = {
  text: string;
  variant?: Variant;
  className?: string;
};

const variantStyles: Record<Variant, string> = {
  default: "text-muted-foreground",
  success: "text-green-600",
  warning: "text-yellow-600",
  danger: "text-red-600",
};

export function InfoTooltip({
  text,
  variant = "default",
  className,
}: Props) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "!h-6 !w-6 p-0",
              variantStyles[variant],
              className
            )}
          >
            <HelpCircle className="h-6 w-6" />
          </Button>
        </TooltipTrigger>

        <TooltipContent
          side="top"
          className="max-w-[220px] text-sm"
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}