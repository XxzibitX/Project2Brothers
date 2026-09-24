import { Controller } from "react-hook-form";
import type {
  FieldPath,
  FieldValues,
  ControllerProps,
} from "react-hook-form";

import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/field";
import { textSize } from "@/constants/adaptive/textSize";
import { cn } from "@/lib/utils";
import { roendedSize } from "@/constants/adaptive/roundedSize";

function formatNumber(raw: string, allowDecimals: boolean = false): string {
  if (allowDecimals) {
    const parts = raw.split(".");

    const integerPart = parts[0].replace(/\D/g, "");
    const decimalPart = parts[1] ? parts[1].replace(/\D/g, "") : "";

    if (!integerPart && !decimalPart && !raw.includes(".")) {
      return "";
    }

    const formattedInteger = integerPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      "\u00A0",
    );

    if (raw.includes(".")) {
      return `${formattedInteger}.${decimalPart}`;
    }

    return formattedInteger;
  }

  const digits = raw.replace(/\D/g, "");

  if (!digits) return "";

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
}

type NumberInputProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = Pick<
  ControllerProps<TFieldValues, TName>,
  "control" | "name" | "rules"
> & {
  placeholder?: string;
  disabled?: boolean;
  suffix?: string;
  errorMessage?: string;
  allowDecimals?: boolean;
  decimalPlaces?: number;
};

export function NumberInput<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  rules,
  placeholder,
  disabled,
  suffix,
  errorMessage,
  allowDecimals = false,
  decimalPlaces = 2,
}: NumberInputProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field }) => {
        const displayValue =
          field.value !== undefined &&
          field.value !== null &&
          field.value !== ""
            ? formatNumber(String(field.value), allowDecimals)
            : "";

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const raw = e.target.value.replace(/\u00A0/g, "").replace(/\s/g, "");

          if (!allowDecimals) {
            const onlyDigits = raw.replace(/\D/g, "");

            field.onChange(onlyDigits ? Number(onlyDigits) : "");

            return;
          }

          const parts = raw.split(".");

          const integerPart = parts[0].replace(/\D/g, "");

          const decimalPart = parts[1]
            ? parts[1].replace(/\D/g, "").slice(0, decimalPlaces)
            : "";

          const hasDecimal = raw.includes(".");

          if (hasDecimal) {
            const stringValue =
              decimalPart.length > 0
                ? `${integerPart}.${decimalPart}`
                : `${integerPart}.`;

            field.onChange(stringValue);
          } else {
            field.onChange(integerPart);
          }
        };

        return (
          <div className="space-y-1">
            <div className="relative">
              <Input
                value={displayValue}
                onChange={handleChange}
                onBlur={field.onBlur}
                ref={field.ref}
                name={field.name}
                type="text"
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                  suffix ? "pr-12" : "",
                  textSize.md,
                  roendedSize.input,
                  "h-12 sm:h-9 text-lg",
                )}
              />

              {suffix && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {suffix}
                </span>
              )}
            </div>

            {errorMessage && (
              <FieldError className="text-sm text-destructive mt-1">
                {errorMessage}
              </FieldError>
            )}
          </div>
        );
      }}
    />
  );
}
