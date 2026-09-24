import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Объединяет className с учётом Tailwind конфликтов
 * (например: "p-2 p-4" → "p-4")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Форматирует Date в строку для input[type="date"]
 * формат: YYYY-MM-DD
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Преобразует Date в ISO-строку
 */
export function formatDateForISO(date: Date): string {
  return date.toISOString()
}

/**
 * Возвращает диапазон дат за последние 7 дней (сегодня включительно)
 */
export function getDefaultWeekDates(): { dateFrom: string; dateTo: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  return {
    dateFrom: formatDateForISO(weekAgo),
    dateTo: formatDateForISO(today),
  }
}

/**
 * Проверяет, соответствует ли выбранный диапазон дат дефолтной "неделе"
 */
export function isDefaultWeekFilter(dateFrom: string | undefined, dateTo: string | undefined): boolean {
  const defaultWeek = getDefaultWeekDates()
  return dateFrom === defaultWeek.dateFrom && dateTo === defaultWeek.dateTo
}

/**
 * Возвращает символ валюты по её коду
 */
export function getCurrencySymbol(currency?: string): string {
  if (!currency) return "₽"

  switch (currency.toUpperCase()) {
    case "USDT":
    case "USD":
      return "$"
    case "EUR":
      return "€"
    case "RUB":
      return "₽"
    default:
      return currency
  }
}

/**
 * Форматирует сумму с символом валюты
 */
export function formatCurrency(amount: number | null | undefined, currency?: string): string {
  const safeAmount = amount ?? 0
  return `${safeAmount.toLocaleString("ru-RU")} ${getCurrencySymbol(currency)}`
}

/**
 * Форматирует ISO дату в читаемый формат (ru-RU)
 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso

  return date.toLocaleString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Форматирует число с разделителями (без валюты)
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(amount)
}
