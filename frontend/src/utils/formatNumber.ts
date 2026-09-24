/**
 * Форматирует число с разделителями (без валюты)
 */
export function formatAmount(value: number, decimals = 2): string {
  const isInteger = Number.isInteger(value);

  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: isInteger ? 0 : decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Форматирует число без лишних нулей после запятой
 */
export function formatNumber(value: number, count?: number): string {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: count ?? 2,
  }).format(value);
}

/**
 * Форматирует миллисекунды в читаемый вид
 */
export function formatNumberMs(value: number): string {
  if (value < 1000) {
    return `${value} мс`;
  }
  if (value < 60_000) {
    return `${formatNumber(value / 1000)} с`;
  }

  const minutes = Math.floor(value / 60_000);
  const seconds = Math.floor((value % 60_000) / 1000);

  return `${minutes} мин ${seconds} с`;
}

/**
 * Возвращает символ валюты по её коду
 */
export function getCurrencySymbol(currency?: string): string {
  const normalized = currency?.trim()?.toUpperCase();

  switch (normalized) {
    case "USDT":
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "RUB":
      return "₽";
    default:
      return normalized ?? "";
  }
}

/**
 * Форматирует сумму с символом валюты
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency?: string,
  decimals = 2,
): string {
  const safeAmount = amount ?? 0;
  const isInteger = Number.isInteger(safeAmount);

  const formatted = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: isInteger ? 0 : decimals,
    maximumFractionDigits: decimals,
  }).format(safeAmount);

  return `${formatted} ${getCurrencySymbol(currency)}`;
}
