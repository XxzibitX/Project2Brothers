import type { Row } from "@tanstack/react-table";

type RowIdValue = string | number;

function toStableId(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return null;
}

export function getReactTableRowKey<TData>(row: Row<TData>): string {
  const original = row.original as { id?: unknown } | undefined;
  return toStableId(original?.id) ?? row.id;
}

export function getReactTableCellKey<TData>(
  row: Row<TData>,
  columnId: string,
): string {
  return `${getReactTableRowKey(row)}:${columnId}`;
}

export function tableGetRowId<TData>(
  row: TData,
  index: number,
): string {
  const original = row as { id?: unknown } | undefined;
  return toStableId(original?.id) ?? String(index);
}

export type { RowIdValue };
