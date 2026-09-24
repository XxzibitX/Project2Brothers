import { detectTrafficValue, formatTrafficValue } from "@/constants/traffic";

export function getDefaultWeekDates(): { dateFrom: string; dateTo: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    dateFrom: formatDate(weekAgo),
    dateTo: formatDate(today),
  };
}

export function isDefaultWeekFilter(
  dateFrom: string | undefined,
  dateTo: string | undefined,
): boolean {
  const defaultWeek = getDefaultWeekDates();
  return dateFrom === defaultWeek.dateFrom && dateTo === defaultWeek.dateTo;
}

export function subtypeValidation(subtype: string, isSecondaryTraffic: boolean): string {
  if (!subtype || !isSecondaryTraffic) return '-';

  const detectedSubtype = detectTrafficValue(subtype);
  if (detectedSubtype) {
    return formatTrafficValue(detectedSubtype);
  }

  return formatTrafficValue(subtype);
}

