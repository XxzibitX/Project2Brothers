import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    if (type === "number") {
      const currentValue = event.target.value
      let normalizedValue = currentValue

      if (/^0+\./.test(normalizedValue)) {
        normalizedValue = normalizedValue.replace(/^0+\./, "0.")
      } else if (/^0\d+/.test(normalizedValue)) {
        normalizedValue = normalizedValue.replace(/^0+/, "")
      }

      if (normalizedValue !== currentValue) {
        event.target.value = normalizedValue
      }
    }

    props.onChange?.(event)
  }

  return (
    <input
      type={type}
      data-slot="input"
      {...props}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-8 w-full min-w-0 rounded-md border bg-transparent px-2.5 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-6 sm:file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:px-3",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        type === "number" &&
          "appearance-textfield [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        className
      )}
      onChange={handleChange}
    />
  )
}

export { Input }