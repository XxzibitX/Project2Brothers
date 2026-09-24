import type { ClipboardEvent, FormEvent, KeyboardEvent } from "react";
import PhoneInputWithCountry, {
  isValidPhoneNumber,
  type Value,
} from "react-phone-number-input";
import ru from "react-phone-number-input/locale/ru";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  placeholder?: string;
};

/** РФ: ровно до 10 цифр после кода страны → +7XXXXXXXXXX */
const RU_NATIONAL_MAX_DIGITS = 10;

function nationalDigitCount(e164: string): number {
  const digits = e164.replace(/\D/g, "");
  if (digits.startsWith("7") || digits.startsWith("8")) {
    return digits.slice(1).length;
  }
  return digits.length;
}

/**
 * Нормализует ввод к E.164 РФ и обрезает лишние цифры.
 * Важно: голое «+7» (только код страны) → пустая строка, иначе получается «+77».
 */
function clampRuE164(raw: string): string {
  if (!raw) return "";

  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  let national: string;
  if (raw.startsWith("+")) {
    // E.164 от библиотеки: первая цифра — код страны
    national = digits.startsWith("7") ? digits.slice(1) : digits;
  } else if (
    digits.length >= 11 &&
    (digits.startsWith("7") || digits.startsWith("8"))
  ) {
    // 8XXXXXXXXXX / 7XXXXXXXXXX при вставке
    national = digits.slice(1);
  } else {
    national = digits;
  }

  national = national.slice(0, RU_NATIONAL_MAX_DIGITS);
  if (!national) return "";
  return `+7${national}`;
}

export function PhoneInput({
  value,
  onChange,
  id,
  disabled,
  className,
  error,
  placeholder = "999 123-45-67",
}: Props) {
  const atLimit = nationalDigitCount(value) >= RU_NATIONAL_MAX_DIGITS;

  const blockExtraDigits = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const allowed = [
      "Backspace",
      "Delete",
      "Tab",
      "Escape",
      "Enter",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ];
    if (allowed.includes(e.key)) return;

    // Разрешаем только цифры
    if (!/^\d$/.test(e.key)) {
      if (e.key.length === 1) e.preventDefault();
      return;
    }

    if (atLimit) {
      e.preventDefault();
    }
  };

  const blockBeforeInput = (e: FormEvent<HTMLInputElement>) => {
    const native = e.nativeEvent as InputEvent;
    if (native.inputType?.startsWith("delete")) return;
    const data = native.data ?? "";
    if (!data) return;

    const incomingDigits = data.replace(/\D/g, "");
    if (!incomingDigits) {
      // пробелы/скобки из автоформата — ок, лишние буквы — нет
      if (/[^\d\s()-]/.test(data)) e.preventDefault();
      return;
    }

    const current = nationalDigitCount(value);
    if (current + incomingDigits.length > RU_NATIONAL_MAX_DIGITS) {
      e.preventDefault();
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    onChange(clampRuE164(e.clipboardData.getData("text")));
  };

  return (
    <div
      className={cn(
        "phone-input-field",
        error && "phone-input-field--error",
        className,
      )}
    >
      <PhoneInputWithCountry
        id={id}
        defaultCountry="RU"
        countries={["RU"]}
        addInternationalOption={false}
        labels={ru}
        countryCallingCodeEditable={false}
        limitMaxLength
        value={(value || undefined) as Value}
        onChange={(next) => {
          onChange(clampRuE164(next ?? ""));
        }}
        disabled={disabled}
        placeholder={placeholder}
        smartCaret
        numberInputProps={{
          autoComplete: "tel",
          inputMode: "tel" as const,
          maxLength: 13,
          placeholder,
          onKeyDown: blockExtraDigits,
          onBeforeInput: blockBeforeInput,
          onPaste,
        }}
      />
    </div>
  );
}

export { isValidPhoneNumber };
