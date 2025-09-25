import * as React from "react";

import type { ColumnDef, FilterFn } from "@tanstack/react-table";

import { dragColumn } from "./drag-column";

export function withDndColumn<T>(columns: ColumnDef<T>[]): ColumnDef<T>[] {
  return [dragColumn as ColumnDef<T>, ...columns];
}

export function withIndexColumn<T>(columns: ColumnDef<T>[]): ColumnDef<T>[] {
  const indexCol: ColumnDef<T> = {
    id: "index",
    header: () => "#",
    cell: ({ row }: any) =>
      React.createElement("span", { className: "tabular-nums" }, (Number(row?.index ?? 0) + 1).toString()),
    enableSorting: false,
    enableHiding: false,
  } as any;
  return [indexCol, ...columns];
}

export const smartFilterFn: FilterFn<any> = (row, columnId, filterValue) => {
  if (Array.isArray(filterValue)) {
    if (!filterValue.length) return true;
    const v = row.getValue(columnId);
    return filterValue.includes(String(v ?? ""));
  }
  if (typeof filterValue === "string") {
    const needle = filterValue.trim().toLowerCase();
    if (!needle) return true;
    const v = row.getValue(columnId);
    return String(v ?? "")
      .toLowerCase()
      .includes(needle);
  }
  return true;
};
