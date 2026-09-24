import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";
import { ru } from "react-day-picker/locale";
import {
  formatDateRU,
  getDateRangesUntilNow,
  getDayRangeUntilNow,
  parseDate,
} from "@/utils/dates";

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
};

function QuickFilters({
  dateFrom,
  dateTo,
  filters,
  onSelect,
}: QuickFiltersProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-white/20 bg-muted/20 p-1">
      {filters.map((filter) => {
        const isActive =
          filter.dateFrom.slice(0, 10) === dateFrom?.slice(0, 10) &&
          filter.dateTo.slice(0, 10) === dateTo?.slice(0, 10);

        return (
          <div key={filter.label} className="group relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onSelect(filter.dateFrom, filter.dateTo);
              }}
              className={cn(
                "!h-6.5 !w-7 rounded-sm p-0 text-[11px] font-semibold uppercase tracking-wide",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                  : "text-muted-foreground hover:text-foreground",
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

type DateFilterProps = {
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange: (date?: string) => void;
  onDateToChange: (date?: string) => void;
  isMobile?: boolean;
};

export function DateUntilNowFilter({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  isMobile,
}: DateFilterProps) {
  const ranges = getDateRangesUntilNow();

  const formatLabel = (value?: string) =>
    value ? formatDateRU(value) : "Выберите дату";

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

  const fromDate = parseDate(dateFrom);
  const toDate = parseDate(dateTo);

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
              "h-9 gap-2 rounded-full border-border/60 bg-background/40 text-xs font-medium",
              hasRange && "border-primary/40 bg-primary/5 text-primary",
            )}
          >
            <CalendarDays className="h-4 w-4" />
            {mobileLabel}
          </Button>
        </SheetTrigger>

        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8">
          <SheetHeader className="mb-5 text-left">
            <SheetTitle>Период</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Быстро:
              </span>
              <QuickFilters
                filters={quickFilters}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onSelect={handleQuickFilter}
              />
            </div>

            {/* FROM */}
            <Calendar
              mode="single"
              selected={fromDate}
              locale={ru}
              weekStartsOn={1}
              onSelect={(selected) => {
                if (!selected) {
                  onDateFromChange(undefined);
                  return;
                }

                const { from } = getDayRangeUntilNow(selected);
                onDateFromChange(from);

                if (toDate && selected > toDate) {
                  const { to } = getDayRangeUntilNow(selected);
                  onDateToChange(to);
                }
              }}
            />

            {/* TO */}
            <Calendar
              mode="single"
              selected={toDate}
              locale={ru}
              weekStartsOn={1}
              onSelect={(selected) => {
                if (!selected) {
                  onDateToChange(undefined);
                  return;
                }

                const { to } = getDayRangeUntilNow(selected);
                onDateToChange(to);

                if (fromDate && selected < fromDate) {
                  const { from } = getDayRangeUntilNow(selected);
                  onDateFromChange(from);
                }
              }}
            />
          </div>

          <SheetFooter className="mt-6">
            <SheetClose asChild>
              <Button className="w-full">Применить</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  // ================= DESKTOP =================
  return (
    <div className="flex items-center gap-2">
      <QuickFilters
        filters={quickFilters}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onSelect={handleQuickFilter}
      />

      <div className="flex items-center gap-2">
        {/* FROM */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="!h-9 w-[155px] justify-start"
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
              onSelect={(selected) => {
                if (!selected) {
                  onDateFromChange(undefined);
                  return;
                }

                const { from } = getDayRangeUntilNow(selected);
                onDateFromChange(from);

                if (toDate && selected > toDate) {
                  const { to } = getDayRangeUntilNow(selected);
                  onDateToChange(to);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* TO */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="!h-9  w-[155px] justify-start"
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
              onSelect={(selected) => {
                if (!selected) {
                  onDateToChange(undefined);
                  return;
                }

                const { to } = getDayRangeUntilNow(selected);
                onDateToChange(to);

                if (fromDate && selected < fromDate) {
                  const { from } = getDayRangeUntilNow(selected);
                  onDateFromChange(from);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
