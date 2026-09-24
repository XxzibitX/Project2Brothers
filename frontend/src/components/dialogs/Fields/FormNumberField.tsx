import type {
  Control,
  FieldErrors,
  FieldPath,
  FieldValues,
  RegisterOptions,
} from "react-hook-form";
import { Field, FieldLabel } from "@/components/ui/field";
import { NumberInput } from "@/shared/components/NumberInput";
import { cn } from "@/lib/utils";
import { textSize } from "@/constants/adaptive/textSize";

type Props<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = {
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  name: TName;
  label: string;
  placeholder: string;
  suffix?: string;
  disabled?: boolean;
  allowDecimals?: boolean;
  rules?: RegisterOptions<TFieldValues, TName>;
};

//
//
//
//
//

export function FormNumberField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  errors,
  name,
  label,
  placeholder,
  suffix,
  disabled,
  allowDecimals,
  rules,
}: Props<TFieldValues, TName>) {
  const error = errors[name];

  return (
    <Field>
      <FieldLabel className={cn(textSize.md)}>
        {label}
        {rules?.required && (
          <span className="ml-1 text-destructive">*</span>
        )}
      </FieldLabel>

      <NumberInput
        control={control}
        name={name}
        placeholder={placeholder}
        suffix={suffix}
        disabled={disabled}
        allowDecimals={allowDecimals}
        rules={rules}
        errorMessage={error?.message as string | undefined}
      />
    </Field>
  );
}