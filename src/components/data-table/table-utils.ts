import * as React from "react";

import type { ColumnDef } from "@tanstack/react-table";

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
