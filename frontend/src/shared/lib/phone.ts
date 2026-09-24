import {
  formatPhoneNumberIntl,
  parsePhoneNumber,
} from "react-phone-number-input";

/** E.164 для tel: ссылок, или очищенные цифры если номер невалиден */
export function toTelHref(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  try {
    const parsed = parsePhoneNumber(trimmed, "RU");
    if (parsed) return `tel:${parsed.number}`;
  } catch {
    /* fallback below */
  }

  const digits = trimmed.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

/**
 * Красивый русский формат: +7 (900) 111-22-33
 * Иначе — международный из libphonenumber, иначе исходная строка.
 */
export function formatPhoneDisplay(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  try {
    const parsed = parsePhoneNumber(trimmed, "RU");
    if (parsed) {
      if (parsed.country === "RU" || parsed.countryCallingCode === "7") {
        const national = parsed.nationalNumber;
        if (national.length === 10) {
          return `+7 (${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6, 8)}-${national.slice(8)}`;
        }
      }
      const intl = formatPhoneNumberIntl(parsed.number);
      if (intl) return intl;
      return parsed.formatInternational();
    }
  } catch {
    /* fallback below */
  }

  const intl = formatPhoneNumberIntl(trimmed);
  return intl || trimmed;
}
