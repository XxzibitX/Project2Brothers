import {
  Controller,
  type Control,
  type FieldErrors,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { textSize } from "@/constants/adaptive/textSize";
import { cn } from "@/lib/utils";
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
  type?: React.HTMLInputTypeAttribute;
  disabled?: boolean;
  rules?: RegisterOptions<TFieldValues, TName>;
};

//
//
//
//
//

export function FormInputField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  errors,
  name,
  label,
  placeholder,
  type = "text",
  disabled,
  rules,
}: Props<TFieldValues, TName>) {
  const error = errors[name];

  return (
    <Field>
      <FieldLabel htmlFor={name} className={cn(textSize.md)}>
        {label}
        {rules?.required && <span className="ml-1 text-destructive">*</span>}
      </FieldLabel>

      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field }) => (
          <Input
            {...field}
            id={name}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              textSize.md,
              roendedSize.input,
              "h-12 sm:h-9 text-lg",
            )}
          />
        )}
      />

      {error?.message && <FieldError>{String(error.message)}</FieldError>}
    </Field>
  );
}
