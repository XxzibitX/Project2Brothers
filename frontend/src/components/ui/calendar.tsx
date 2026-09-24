import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ru } from "react-day-picker/locale";

import { cn } from "@/lib/utils";
import { ButtonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  locale = ru,
  weekStartsOn = 1,
  ...props
}: CalendarProps) {
  const localeCode =
    typeof locale === "string" ? locale : (locale?.code ?? "ru-RU");

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={locale}
      weekStartsOn={weekStartsOn}
      formatters={{
        formatCaption: (month) => {
          const label = new Intl.DateTimeFormat(localeCode, {
            month: "long",
            year: "numeric",
          }).format(month);

          return label.charAt(0).toUpperCase() + label.slice(1);
        },
        formatWeekdayName: (date) => {
          const label = new Intl.DateTimeFormat(localeCode, {
            weekday: "short",
          })
            .format(date)
            .replace(".", "");

          return label.charAt(0).toUpperCase() + label.slice(1);
        },
      }}
      className={cn(
        "rounded-md border border-border/60 bg-popover p-3 text-foreground shadow-md",
        className,
      )}
      classNames={{
        months: "flex flex-col gap-3",
        month: "space-y-3",

        month_caption: "relative flex h-9 items-center justify-center px-10",
        caption_label: "text-sm font-semibold tracking-wide",

        nav: "flex items-center justify-between h-9",
        button_previous: cn(
          ButtonVariants({ variant: "ghost", size: "icon-sm" }),
          "relative z-10 pointer-events-auto flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 bg-background/40 p-0 text-muted-foreground hover:bg-accent/70 hover:text-foreground fill-white",
        ),
        button_next: cn(
          ButtonVariants({ variant: "ghost", size: "icon-sm" }),
          "relative z-10 pointer-events-auto flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 bg-background/40 p-0 text-muted-foreground hover:bg-accent/70 hover:text-foreground fill-white",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "grid grid-cols-7 gap-1",
        weekday:
          "flex h-8 items-center justify-center text-center text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70",

        week: "mt-1 grid grid-cols-7 gap-1",

        cell: "h-9 w-full p-0",
        day: "h-9 w-full p-0",
        day_button: cn(
          ButtonVariants({ variant: "ghost", size: "icon-sm" }),
          "h-9 w-10  border border-transparent p-0 text-sm font-medium hover:border-primary/40 hover:bg-primary/10 aria-selected:opacity-100",
        ),

        selected:
          "[&>button]:bg-gradient-to-br [&>button]:from-zinc-100 [&>button]:to-zinc-300 [&>button]:text-zinc-950 [&>button]:shadow-sm [&>button:hover]:from-zinc-50 [&>button:hover]:to-zinc-200",
        today:
          "[&>button]:border [&>button]:border-primary/60 [&>button]:text-primary",
        outside: "[&>button]:text-muted-foreground/30",
        disabled: "[&>button]:text-muted-foreground/20",
        hidden: "invisible",

        ...classNames,
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
