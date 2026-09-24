import { DateTime } from "luxon";
import { useMemo } from "react";

/* ======================== Константы ======================== */

const MSK = "Europe/Moscow";

/**
 * текущее время в МСК
 * просто обертка, чтобы не забывать про таймзону
 */
const nowMSK = () => DateTime.now().setZone(MSK);

/**
 * Берём дату (без времени) > в МСК
 */
function fromDateMSK(date: Date): DateTime {
  const d = DateTime.fromJSDate(date);

  return DateTime.fromObject(
    {
      year: d.year,
      month: d.month,
      day: d.day,
    },
    { zone: MSK }
  );
}

/**
 * безопасный toISO
 * luxon может вернуть null, но в нашем кейсе это не ок
 */
function toISO(dt: DateTime): string {
  const iso = dt.toUTC().toISO();
  if (!iso) {
    throw new Error("Invalid DateTime");
  }
  return iso;
}

/* ======================== Границы дня ======================== */

/**
 * начало дня (00:00) по МСК → в UTC ISO
 * это то что мы шлем в бек
 */
export function toStartOfDayISO(date: Date): string {
  return toISO(fromDateMSK(date).startOf("day").toUTC());
}

/**
 * конец дня (23:59:59.999) по МСК → в UTC ISO
 */
export function toEndOfDayISO(date: Date): string {
  return toISO(fromDateMSK(date).endOf("day").toUTC());
}

/**
 * начало дня как Date (локально, но с логикой МСК)
 */
export function startOfDay(date: Date): Date {
  return fromDateMSK(date).startOf("day").toJSDate();
}

/**
 * конец дня как Date
 */
export function endOfDay(date: Date): Date {
  return fromDateMSK(date).endOf("day").toJSDate();
}

/* ======================== Парсинг ======================== */

/**
 * парсит ISO строку в Date
 * если криво → undefined
 */
export function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;

  const dt = DateTime.fromISO(value, { zone: MSK });
  return dt.isValid ? dt.toJSDate() : undefined;
}

export function parseDateForCalendary(
  value?: string,
): Date | undefined {
  if (!value) return undefined;

  const dt = DateTime.fromISO(value)
    .setZone(MSK);

  if (!dt.isValid) {
    return undefined;
  }

  return new Date(
    dt.year,
    dt.month - 1,
    dt.day,
  );
}

/**
 * DD/MM/YYYY → YYYY-MM-DD
 * юзерский ввод
 */
export function parseRuDateToIsoDate(value: string): string | undefined {
  const dt = DateTime.fromFormat(value.trim(), "dd/MM/yyyy", {
    zone: MSK,
  });

  if (!dt.isValid) return undefined;

  return dt.toFormat("yyyy-MM-dd");
}

/* ======================== Форматирование ======================== */

/**
 * для input[type="date"] ------------------------------------------
 */
export function formatDateForInput(date: Date): string {
  return fromDateMSK(date).toFormat("yyyy-MM-dd");
}

/**
 * просто ISO (в UTC) ----------------------------------------------
 */
export function formatDateForISO(date: Date): string {
  return toISO(fromDateMSK(date).toUTC());
}

/**
 * ISO → 31.12.2025
 */
export function formatDateRU(value?: string): string {
  if (!value) return "";

  const dt = DateTime.fromISO(value).setZone(MSK);
  if (!dt.isValid) return "";

  return dt.setLocale("ru").toFormat("dd.MM.yyyy");
}

/**
 * ISO → 31.12.2025, 12:30:45
 */
export function formatDateRUWithTime(value?: string): string {
  if (!value) return "";

  const dt = DateTime.fromISO(value).setZone(MSK);
  if (!dt.isValid) return "";

  return dt.setLocale("ru").toFormat("dd.MM.yyyy, HH:mm:ss");
}

/**
 * ISO → 31.12.2025, 12:30
 * без секунд (чаще всего нужен именно такой)
 */
export function formatDateTime(iso: string): string {
  const dt = DateTime.fromISO(iso).setZone(MSK);
  if (!dt.isValid) return iso;

  return dt.setLocale("ru").toFormat("dd.MM.yyyy, HH:mm");
}

/**
 * YYYY-MM-DD → DD/MM/YYYY
 * для кастомного инпута
 */
export function formatIsoDateToInput(value: string): string {
  const dt = DateTime.fromISO(value, { zone: MSK });
  if (!dt.isValid) return value;

  return dt.toFormat("dd/MM/yyyy");
}

/**
 * маска ввода даты
 * 01022025 → 01/02/2025
 */
export function formatDateInputMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/* ======================== Диапазоны ======================== */

export interface DateRange {
  dateFrom: string;
  dateTo: string;
}

export interface DateRangePresets {
  today: DateRange;
  week: DateRange;
  month: DateRange;
}

/**
 * быстрые пресеты
 * сегодня / неделя / месяц
 */
export function getDateRanges(): DateRangePresets {
  const now = nowMSK();

  return {
    today: {
      dateFrom: toISO(now.startOf("day")),
      dateTo: toISO(now.endOf("day")),
    },
    week: {
      dateFrom: toISO(now.minus({ days: 7 }).startOf("day")),
      dateTo: toISO(now.endOf("day")),
    },
    month: {
      dateFrom: toISO(now.minus({ months: 1 }).startOf("day")),
      dateTo: toISO(now.endOf("day")),
    },
  };
}

/**
 * диапазон для любого выбранного дня с текущем временем
 */

export function getDayRangeUntilNow(date: Date) {
  const base = fromDateMSK(date);
  const now = nowMSK();

  const isToday =
    base.hasSame(now, "day");

  return {
    from: toISO(base.startOf("day")),
    to: isToday
      ? toISO(now)
      : toISO(base.endOf("day")),
  };
}

/**
 * быстрые пресеты с текущем временем
 * сегодня / неделя / месяц
 */

export function getDateRangesUntilNow(): DateRangePresets {
  const now = nowMSK();

  return {
    today: {
      dateFrom: toISO(now.startOf("day")),
      dateTo: toISO(now),
    },
    week: {
      dateFrom: toISO(
        now.minus({ days: 7 }).startOf("day"),
      ),
      dateTo: toISO(now),
    },
    month: {
      dateFrom: toISO(
        now.minus({ months: 1 }).startOf("day"),
      ),
      dateTo: toISO(now),
    },
  };
}

/**
 * дефолт — последняя неделя
 */
export function getDefaultWeekDates(): DateRange {
  const now = nowMSK();

  return {
    dateFrom: toISO(now.minus({ days: 7 }).startOf("day").toUTC()),
    dateTo: toISO(now.endOf("day").toUTC()),
  };
}

/**
 * дефолт — 30 дней ------------------------------------------------
 */
export function getDefaultMonthDates(): DateRange {
  const now = nowMSK();

  return {
    dateFrom: toISO(now.minus({ days: 30 }).startOf("day").toUTC()),
    dateTo: toISO(now.endOf("day").toUTC()),
  };
}

/**
 * вчера → сегодня
 */
export function getDefaultDate(): DateRange {
  const now = nowMSK();

  return {
    dateFrom: toISO(now.minus({ days: 1 }).startOf("day").toUTC()),
    dateTo: toISO(now.endOf("day").toUTC()),
  };
}

/**
 * получить дату N дней назад (конец дня)
 */
export function getDate(daysAgo: number): string {
  return toISO(
    nowMSK()
      .minus({ days: daysAgo })
      .endOf("day")
      .toUTC(),
  );
}

/**
 * проверка — дефолтная ли неделя сейчас стоит
 */
export function isDefaultWeekFilter(
  dateFrom?: string,
  dateTo?: string,
): boolean {
  const def = getDefaultWeekDates();
  return dateFrom === def.dateFrom && dateTo === def.dateTo;
}

/**
 * диапазон одного дня (МСК → UTC)
 */
export function getDayRange(date: Date) {
  const base = fromDateMSK(date);

  return {
    from: toISO(base.startOf("day")),
    to: toISO(base.endOf("day")),
  };
}

export function getMskDateKey(
  iso: string,
): string {
  return DateTime
    .fromISO(iso)
    .setZone("Europe/Moscow")
    .toFormat("yyyy-MM-dd");
}

export function isoToMskTime(iso?: string): string {
  if (!iso) return "00:00";
  const dt = DateTime.fromISO(iso).setZone("Europe/Moscow");
  return dt.isValid ? dt.toFormat("HH:mm") : "00:00";
}

/* ======================== React hook ======================== */

/**
 * дефолтный диапазон для фильтров
 * (вчера → сегодня)
 */
export function useDefaultDateRange(): DateRange {
  return useMemo(() => {
    const now = nowMSK();

    return {
      dateFrom: toISO(now.minus({ days: 1 }).startOf("day").toUTC()),
      dateTo: toISO(now.endOf("day").toUTC()),
    };
  }, []);
}