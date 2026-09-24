import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { ru } from "react-day-picker/locale";
import {
  formatDateRU,
  formatDateTime,
  getDateRanges,
  getDayRange,
  isoToMskTime,
  parseDateForCalendary,
} from "@/utils/dates";

function applyTimeMSK(isoDate: string, time: string): string {
  const [h, m] = time.split(":").map(Number);
  return DateTime.fromISO(isoDate)
    .setZone("Europe/Moscow")
    .set({ hour: h || 0, minute: m || 0, second: 0, millisecond: 0 })
    .toUTC()
    .toISO()!;
}

type QuickFilter = {
  label: string;
  tooltip: string;
  dateFrom: string;
  dateTo: string;
};

type QuickFiltersProps = {
  filters: QuickFilter[];
  dateFrom?: string;
  dateTo?: string;
  onSelect: (from: string, to: string) => void;
  isMobile?: boolean;
};

function QuickFilters({
  filters,
  dateFrom,
  dateTo,
  onSelect,
  isMobile = false,
}: QuickFiltersProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-white/20 bg-muted/20 p-1">
      {filters.map((filter) => {
        const isActive =
          dateFrom === filter.dateFrom && dateTo === filter.dateTo;

        return (
          <div key={filter.label} className="group relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelect(filter.dateFrom, filter.dateTo)}
              className={cn(
                "!h-6.5 !w-7 rounded-sm p-0 text-[11px] font-semibold uppercase tracking-wide",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                  : "text-muted-foreground hover:text-foreground",
                isMobile && "text-lg !h-9 !w-9",
              )}
            >
              {filter.label}
            </Button>

            <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-full pb-1 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="whitespace-nowrap rounded-[6px] border border-border/60 bg-popover px-2 py-1 text-xs shadow-sm">
                {filter.tooltip}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

type TimeInputProps = {
  value: string;
  onChange: (time: string) => void;
  isMobile?: boolean;
};

function parseTimeParts(value: string): { hour: string; minute: string } {
  const [rawHour = "00", rawMinute = "00"] = value.split(":");
  const hourNum = Number(rawHour);
  const minuteNum = Number(rawMinute);
  const hour = Number.isFinite(hourNum)
    ? String(Math.min(23, Math.max(0, hourNum))).padStart(2, "0")
    : "00";
  const minute = Number.isFinite(minuteNum)
    ? String(Math.min(59, Math.max(0, minuteNum))).padStart(2, "0")
    : "00";
  return { hour, minute };
}

function clampTimePart(raw: string, max: number): number {
  if (raw === "") {
    return 0;
  }

  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(max, Math.max(0, Math.trunc(value)));
}

function TimeInput({ value, onChange, isMobile }: TimeInputProps) {
  const [localTime, setLocalTime] = useState(value);
  const debouncedTime = useDebounce(localTime, 400);
  const { hour, minute } = parseTimeParts(localTime);

  useEffect(() => {
    setLocalTime(value);
  }, [value]);

  useEffect(() => {
    if (debouncedTime === value) {
      return;
    }

    onChange(debouncedTime);
  }, [debouncedTime, value]);

  const inputClassName = cn(
    "h-7 w-11 px-1.5 text-center text-xs tabular-nums sm:h-7 sm:px-1.5",
    isMobile && "h-12 w-14 px-2 text-lg",
  );

  return (
    <div
      className={cn("flex items-center gap-2", isMobile && "justify-center")}
    >
      <span
        className={cn("text-xs text-muted-foreground", isMobile && "text-base")}
      >
        Время (МСК):
      </span>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          max={23}
          inputMode="numeric"
          aria-label="Часы"
          value={Number(hour)}
          onChange={(e) => {
            const nextHour = clampTimePart(e.target.value, 23);
            setLocalTime(`${String(nextHour).padStart(2, "0")}:${minute}`);
          }}
          className={inputClassName}
        />
        <span
          className={cn("text-xs text-muted-foreground", isMobile && "text-base")}
        >
          :
        </span>
        <Input
          type="number"
          min={0}
          max={59}
          inputMode="numeric"
          aria-label="Минуты"
          value={Number(minute)}
          onChange={(e) => {
            const nextMinute = clampTimePart(e.target.value, 59);
            setLocalTime(`${hour}:${String(nextMinute).padStart(2, "0")}`);
          }}
          className={inputClassName}
        />
      </div>
    </div>
  );
}

type DateFilterProps = {
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange: (date?: string) => void;
  onDateToChange: (date?: string) => void;
  isMobile?: boolean;
  isShowQuickDates?: boolean;
  withTime?: boolean;
};

export function DateFilter({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  isMobile,
  isShowQuickDates = true,
  withTime = true,
}: DateFilterProps) {
  const ranges = getDateRanges();

  const formatLabel = (value?: string) => {
    if (!value) return "Выберите дату";
    return withTime ? formatDateTime(value) : formatDateRU(value);
  };

  const quickFilters: QuickFilter[] = [
    {
      label: "Д",
      tooltip: "День",
      dateFrom: ranges.today.dateFrom,
      dateTo: ranges.today.dateTo,
    },
    {
      label: "Н",
      tooltip: "Неделя",
      dateFrom: ranges.week.dateFrom,
      dateTo: ranges.week.dateTo,
    },
    {
      label: "М",
      tooltip: "Месяц",
      dateFrom: ranges.month.dateFrom,
      dateTo: ranges.month.dateTo,
    },
  ];

  const handleQuickFilter = (from: string, to: string) => {
    onDateFromChange(from);
    onDateToChange(to);
  };

  const fromDate = parseDateForCalendary(dateFrom);
  const toDate = parseDateForCalendary(dateTo);

  const fromTime = isoToMskTime(dateFrom);
  const toTime = isoToMskTime(dateTo);

  const handleFromDaySelect = (selected: Date | undefined) => {
    if (!selected) {
      onDateFromChange(undefined);
      return;
    }

    if (!withTime) {
      const { from } = getDayRange(selected);
      onDateFromChange(from);
      if (toDate && selected > toDate) {
        const { to } = getDayRange(selected);
        onDateToChange(to);
      }
      return;
    }

    const [h, m] = fromTime.split(":").map(Number);
    const result = DateTime.fromObject(
      {
        year: selected.getFullYear(),
        month: selected.getMonth() + 1,
        day: selected.getDate(),
        hour: h || 0,
        minute: m || 0,
        second: 0,
        millisecond: 0,
      },
      { zone: "Europe/Moscow" },
    )
      .toUTC()
      .toISO()!;
    onDateFromChange(result);

    if (toDate && selected > toDate) {
      const [th, tm] = toTime.split(":").map(Number);
      const toResult = DateTime.fromObject(
        {
          year: selected.getFullYear(),
          month: selected.getMonth() + 1,
          day: selected.getDate(),
          hour: th || 0,
          minute: tm || 0,
          second: 0,
          millisecond: 0,
        },
        { zone: "Europe/Moscow" },
      )
        .toUTC()
        .toISO()!;
      onDateToChange(toResult);
    }
  };

  const handleToDaySelect = (selected: Date | undefined) => {
    if (!selected) {
      onDateToChange(undefined);
      return;
    }

    if (!withTime) {
      const { to } = getDayRange(selected);
      onDateToChange(to);
      if (fromDate && selected < fromDate) {
        const { from } = getDayRange(selected);
        onDateFromChange(from);
      }
      return;
    }

    const [h, m] = toTime.split(":").map(Number);
    const result = DateTime.fromObject(
      {
        year: selected.getFullYear(),
        month: selected.getMonth() + 1,
        day: selected.getDate(),
        hour: h || 0,
        minute: m || 0,
        second: 0,
        millisecond: 0,
      },
      { zone: "Europe/Moscow" },
    )
      .toUTC()
      .toISO()!;
    onDateToChange(result);

    if (fromDate && selected < fromDate) {
      const [fh, fm] = fromTime.split(":").map(Number);
      const fromResult = DateTime.fromObject({
        year: selected.getFullYear(),
        month: selected.getMonth() + 1,
        day: selected.getDate(),
        hour: fh || 0,
        minute: fm || 0,
        second: 0,
        millisecond: 0,
      })
        .toUTC()
        .toISO()!;
      onDateFromChange(fromResult);
    }
  };

  const handleFromTimeChange = (time: string) => {
    if (!dateFrom) return;
    onDateFromChange(applyTimeMSK(dateFrom, time));
  };

  const handleToTimeChange = (time: string) => {
    if (!dateTo) return;
    onDateToChange(applyTimeMSK(dateTo, time));
  };

  // ================= MOBILE =================
  if (isMobile) {
    const hasRange = dateFrom || dateTo;
    const activeQuick = quickFilters.find(
      (f) => f.dateFrom === dateFrom && f.dateTo === dateTo,
    );
    const mobileLabel = activeQuick
      ? activeQuick.tooltip
      : hasRange
        ? `${formatLabel(dateFrom)} — ${formatLabel(dateTo)}`
        : "Период";

    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "py-2 h-10 w-full gap-2 rounded-[6px] border-border/60 bg-background/40 text-lg font-medium",
              hasRange && "border-primary/40 bg-primary/5 text-primary",
            )}
          >
            <CalendarDays style={{ width: 16, height: 16 }} />
            {mobileLabel}
          </Button>
        </SheetTrigger>

        <SheetContent
          side="bottom"
          className="h-[95%] rounded-t-2xl px-4 pb-8 flex flex-col"
        >
          <SheetHeader className="my-2 text-center text-2xl">
            <SheetTitle>Период</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold tracking-wide text-muted-foreground">
                  Быстро:
                </span>
                <QuickFilters
                  filters={quickFilters}
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  onSelect={handleQuickFilter}
                  isMobile={true}
                />
              </div>

              {/* FROM */}
              <Calendar
                mode="single"
                selected={fromDate}
                locale={ru}
                weekStartsOn={1}
                onSelect={handleFromDaySelect}
              />
              {withTime && (
                <TimeInput
                  value={fromTime}
                  onChange={handleFromTimeChange}
                  isMobile
                />
              )}

              {/* TO */}
              <Calendar
                mode="single"
                selected={toDate}
                locale={ru}
                weekStartsOn={1}
                onSelect={handleToDaySelect}
              />
              {withTime && (
                <TimeInput
                  value={toTime}
                  onChange={handleToTimeChange}
                  isMobile
                />
              )}
            </div>
          </div>
          <SheetFooter className="mt-2 p-0">
            <SheetClose asChild>
              <Button size="lg" className="w-full h-12 text-xl md:text-sm">
                Применить
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  // ================= DESKTOP =================
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        {/* FROM */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="!h-9 w-fit justify-start"
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              {formatLabel(dateFrom)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={fromDate}
              locale={ru}
              weekStartsOn={1}
              onSelect={handleFromDaySelect}
              className="border-0 shadow-none"
              initialFocus
            />
            {withTime && (
              <div className="border-t border-border p-3">
                <TimeInput value={fromTime} onChange={handleFromTimeChange} />
              </div>
            )}
          </PopoverContent>
        </Popover>

        {isShowQuickDates && (
          <QuickFilters
            filters={quickFilters}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onSelect={handleQuickFilter}
          />
        )}

        {/* TO */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="!h-9 w-fit justify-start"
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              {formatLabel(dateTo)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={toDate}
              locale={ru}
              weekStartsOn={1}
              onSelect={handleToDaySelect}
              className="border-0 shadow-none"
              initialFocus
            />
            {withTime && (
              <div className="border-t border-border p-3">
                <TimeInput value={toTime} onChange={handleToTimeChange} />
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
