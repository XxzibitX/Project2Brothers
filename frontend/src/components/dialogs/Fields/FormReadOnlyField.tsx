import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { roendedSize } from "@/constants/adaptive/roundedSize";
import { textSize } from "@/constants/adaptive/textSize";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value?: string | number | null;
};

export function FormReadOnlyField({ label, value }: Props) {
  return (
    <Field>
      <FieldLabel className={cn(textSize.md)}>{label}</FieldLabel>

      <Input
        value={value ?? ""}
        className={cn(
          textSize.md,
          roendedSize.input,
          "h-12 sm:h-9 text-lg min-w-[100px]",
        )}
        disabled
      />
    </Field>
  );
}
