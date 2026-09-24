import { FieldError } from "@/components/ui/field";

type Props = {
  error?: string | null;
};

export function FormRequestError({
  error,
}: Props) {
  if (!error) {
    return null;
  }
  return (
    <FieldError className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
      Ошибка: {error}
    </FieldError>
  );
}