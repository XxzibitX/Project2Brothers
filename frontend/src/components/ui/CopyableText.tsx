"use client";

import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type CopyableTextProps = {
  value: string | null | undefined;
  className?: string;
  truncate?: boolean;
  truncateLength?: number;
};

export function CopyableText({
  value,
  className,
  truncate = true,
  truncateLength = 12,
}: CopyableTextProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (!value) {
    return <span className="text-muted-foreground">—</span>;
  }

  const displayValue = truncate && value.length > truncateLength
    ? `${value.slice(0, truncateLength)}...`
    : value;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors",
              className
            )}
          >
            <span>{displayValue}</span>
            {copied && <Check className="h-3.5 w-3.5 text-green-500" />}
            {!copied && <Copy className="h-3.5 w-3.5" />}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {copied ? "Скопировано" : "Нажмите, чтобы скопировать"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
