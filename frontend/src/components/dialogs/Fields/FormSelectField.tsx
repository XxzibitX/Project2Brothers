import {
  Controller,
  type Control,
  type FieldErrors,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { textSize } from "@/constants/adaptive/textSize";
import { cn } from "@/lib/utils";
import { roendedSize } from "@/constants/adaptive/roundedSize";

type Props<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
  TValue extends string,
> = {
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  name: TName;
  label: string;
  placeholder: string;
  options: readonly TValue[];
  rules?: RegisterOptions<TFieldValues, TName>;
  getLabel?: (value: TValue) => string;
  disabled?: boolean;
  emptyPlaceholder?: string;
};

//
//
//
//
//

export function FormSelectField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
  TValue extends string,
>({
  control,
  errors,
  name,
  label,
  placeholder,
  options,
  rules,
  getLabel,
  disabled,
  emptyPlaceholder,
}: Props<TFieldValues, TName, TValue>) {
  const error = errors[name];

  return (
    <Field>
      <FieldLabel htmlFor={String(name)} className={cn(textSize.md, "mb-0")}>
        {label}
        {rules?.required && <span className="ml-1 text-destructive">*</span>}
      </FieldLabel>

      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field }) => {
          const isEmpty = options.length === 0;

          return (
            <Select
              value={isEmpty ? "" : (field.value ?? "")}
              onValueChange={field.onChange}
              disabled={disabled || isEmpty}
            >
              <SelectTrigger
                id={String(name)}
                className={cn(
                  textSize.md,
                  roendedSize.input,
                  "h-12 sm:h-9 text-lg w-full",
                )}
              >
                <SelectValue
                  placeholder={
                    isEmpty && emptyPlaceholder ? emptyPlaceholder : placeholder
                  }
                />
              </SelectTrigger>

              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option} value={option} className={cn(textSize.md)}>
                    {getLabel ? getLabel(option) : option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }}
      />

      {error?.message && (
        <FieldError className="mt-1 text-sm text-destructive">
          {String(error.message)}
        </FieldError>
      )}
    </Field>
  );
}
