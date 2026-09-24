import { Field, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { textSize } from "@/constants/adaptive/textSize";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  description?: string;
  checked?: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
};

//
//
//
//
//

export function FormSwitchField({
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: Props) {
  return (
    <Field>
      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <div>
          <FieldLabel className={cn(textSize.md, "mb-0")}>
            {label}
          </FieldLabel>

          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
        />
      </div>
    </Field>
  );
}