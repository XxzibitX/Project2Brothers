import {
  Controller,
  type Control,
  type FieldErrors,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { textSize } from "@/constants/adaptive/textSize";
import { roendedSize } from "@/constants/adaptive/roundedSize";

type Props<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = {
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  name: TName;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  rules?: RegisterOptions<TFieldValues, TName>;
  allowCopy?: boolean;
  generatePassword?: () => string;
};

//
//
//
//
//

export function FormPasswordField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  errors,
  name,
  label,
  placeholder,
  disabled,
  rules,
  allowCopy = false,
  generatePassword,
}: Props<TFieldValues, TName>) {
  const [copied, setCopied] = useState(false);

  const error = errors[name];

  return (
    <Field>
      <FieldLabel className={cn(textSize.md)}>{label}</FieldLabel>

      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field }) => (
          <>
            <div className="flex gap-2">
              <Input
                {...field}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                  textSize.md,
                  roendedSize.input,
                  "h-12 sm:h-9 text-lg min-w-[100px]",
                )}
              />

              {allowCopy && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={!field.value}
                  onClick={async () => {
                    await navigator.clipboard.writeText(field.value);

                    setCopied(true);

                    setTimeout(() => {
                      setCopied(false);
                    }, 1000);
                  }}
                  className={cn(
                    textSize.md,
                    roendedSize.input,
                    "h-12 sm:h-9 text-lg px-6 sm:px-4",
                  )}
                >
                  {copied ? (
                    <Check className="text-green-500" />
                  ) : (
                    <Copy className={cn("size-5 sm:size-4")} />
                  )}
                </Button>
              )}

              {generatePassword && (
                <Button
                  type="button"
                  onClick={() => field.onChange(generatePassword())}
                  className={cn(roendedSize.input, "h-12 sm:h-9 px-6 sm:px-4 sm:w-[190px]")}
                >
                  <span className="hidden sm:inline">Сгенерировать</span>
                  <span className="inline text-lg sm:hidden">Сгенерир.</span>
                </Button>
              )}
            </div>

            {error?.message && (
              <FieldError className="mt-1">{String(error.message)}</FieldError>
            )}
          </>
        )}
      />
    </Field>
  );
}
