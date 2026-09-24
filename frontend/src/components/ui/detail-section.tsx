import * as React from "react";

import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { textSize } from "@/constants/adaptive/textSize";

interface DetailSectionProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  showHeader?: boolean;
  children: React.ReactNode;
}

function DetailSection({
  title,
  subtitle,
  actions,
  className,
  contentClassName,
  showHeader = true,
  children,
}: DetailSectionProps) {
  return (
    <section
      className={cn(
        "space-y-2",
        className,
      )}
    >
      {showHeader ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <h2 className={cn(textSize.hg, "text-lg sm:text-xl font-semibold tracking-tight")}>{title}</h2>
            {subtitle ? (
              <p className={cn(textSize.md, "mt-1 text-muted-foreground")}>{subtitle}</p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn(contentClassName)}>{children}</div>
    </section>
  );
}

interface DetailItemProps {
  label: string;
  className?: string;
  valueClassName?: string;
  children: React.ReactNode;
}

function DetailList({
  className,
  children,
  showHeader,
  variant = "columns",
  headerLabels = ["Поле", "Значение"],
}: {
  className?: string;
  children: React.ReactNode;
  showHeader?: boolean;
  variant?: "rows" | "columns";
  headerLabels?: [string, string];
}) {
  const items = React.Children.toArray(children).filter(React.isValidElement) as Array<
    React.ReactElement<DetailItemProps>
  >;
  const shouldShowHeader = showHeader ?? (variant === "columns");

  if (variant === "columns") {
    const baseItems = items.map((item) => ({
      label: item.props.label,
      className: item.props.className,
      valueClassName: item.props.valueClassName,
      children: item.props.children,
    }));
    const displayItems =
      items.length === 2
        ? [
            ...baseItems,
            ...Array.from({ length: 3 }, () => ({
              label: "",
              className: "text-transparent",
              valueClassName: "text-transparent",
              children: null,
            })),
          ]
        : baseItems;
    const getAlignmentClass = (index: number) => {
      if (index === 0) return "text-start";
      if (index === displayItems.length - 1) return "text-end";
      return "text-center";
    };

    return (
      <div
        className={cn(
          "overflow-hidden",
          className,
        )}
      >
        <Table className="w-full table-auto sm:table-fixed">
          {shouldShowHeader ? (
            <TableHeader>
              <TableRow className="hover:bg-transparent data-[state=selected]:bg-transparent transition-none">
                {displayItems.map((item, index) => (
                  <TableHead
                    key={`${item.label}-${index}`}
                    className={cn(
                      "text-sm sm:text-base font-semibold text-muted-foreground",
                      getAlignmentClass(index),
                    )}
                  >
                    {item.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
          ) : null}
          <TableBody>
            <TableRow className="border-b-0 hover:bg-transparent data-[state=selected]:bg-transparent transition-none">
              {displayItems.map((item, index) => (
                <TableCell
                  key={`${item.label}-${index}`}
                  className={cn(
                    "text-sm sm:text-base lg:text-lg font-medium align-top whitespace-normal break-words overflow-visible text-clip",
                    getAlignmentClass(index),
                    item.valueClassName,
                    item.className,
                  )}
                >
                  {item.children}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden",
        className,
      )}
    >
      <Table className="table-fixed">
        {shouldShowHeader ? (
          <TableHeader>
            <TableRow className="hover:bg-transparent data-[state=selected]:bg-transparent transition-none">
              <TableHead className="w-[180px] sm:w-[220px] lg:w-[350px] text-start">
                {headerLabels[0]}
              </TableHead>
              <TableHead className="text-start">{headerLabels[1]}</TableHead>
            </TableRow>
          </TableHeader>
        ) : null}
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}

function DetailItem({
  label,
  className,
  valueClassName,
  children,
}: DetailItemProps) {
  return (
    <TableRow
      className={cn(
        "border-b border-border/60 last:border-b-0 hover:bg-transparent data-[state=selected]:bg-transparent transition-none",
        className,
      )}
    >
      <TableCell className="w-[140px] sm:w-[180px] lg:w-[220px] text-start font-medium">
        {label}
      </TableCell>
      <TableCell
        className={cn(
          "text-sm",
          valueClassName,
        )}
      >
        {children}
      </TableCell>
    </TableRow>
  );
}

export { DetailItem, DetailList, DetailSection };