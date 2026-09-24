import {
  Controller,
  type Control,
  type FieldErrors,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
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
};

export function FormTagsField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  errors,
  name,
  label,
  placeholder = "Введите тег",
  disabled,
}: Props<TFieldValues, TName>) {
  const [input, setInput] = useState("");

  const error = errors[name];

  return (
    <Field>
      <FieldLabel className={cn(textSize.md)}>
        {label}
      </FieldLabel>

      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const tags = (field.value as string[]) ?? [];

          const addTag = () => {
            const value = input.trim();

            if (!value || tags.includes(value)) {
              return;
            }

            field.onChange([...tags, value]);
            setInput("");
          };

          const removeTag = (tag: string) => {
            field.onChange(tags.filter((t) => t !== tag));
          };

          return (
            <>
              <div className="flex gap-2">
                <Input
                  value={input}
                  placeholder={placeholder}
                  disabled={disabled}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className={cn(
                    textSize.md,
                    roendedSize.input,
                    "h-12 sm:h-9 text-lg",
                  )}
                />

                <Button
                  type="button"
                  onClick={addTag}
                  disabled={disabled || !input.trim()}
                  className={cn(
                    roendedSize.input,
                    "h-12 sm:h-9 px-6 sm:px-4",
                  )}
                >
                  Добавить
                </Button>
              </div>

              {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <div
                      key={tag}
                      className="flex bg-white/5 items-center gap-1 border rounded-sm py-1 px-2"
                    >
                      <span className="pb-0.5">{tag}</span>

                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => removeTag(tag)}
                        className="ml-1"
                      >
                        <Trash2 className="size-4 hover:text-red-500/90" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        }}
      />

      {error?.message && (
        <FieldError>
          {String(error.message)}
        </FieldError>
      )}
    </Field>
  );
}