import { Button } from "@/components/ui/button";
import { Field } from "../field";
import { cn } from "@/lib/utils";
import { textSize } from "@/constants/adaptive/textSize";
import { roendedSize } from "@/constants/adaptive/roundedSize";

type Props = {
  isPending: boolean;
  onCancel: () => void;

  cancelLabel?: string;
  submitLabel?: string;
  pendingLabel?: string;
};

export function DialogActions({
  isPending,
  onCancel,
  cancelLabel = "Отмена",
  submitLabel = "Создать",
  pendingLabel = "Создание...",
}: Props) {
  return (
    <Field>
      <div className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
          className={cn(textSize.md, roendedSize.input, "w-full py-2.5")}
        >
          {cancelLabel}
        </Button>

        <Button
          type="submit"
          disabled={isPending}
          className={cn(textSize.md, roendedSize.input, "w-full py-2.5")}
        >
          {isPending ? pendingLabel : submitLabel}
        </Button>
      </div>
    </Field>
  );
}
