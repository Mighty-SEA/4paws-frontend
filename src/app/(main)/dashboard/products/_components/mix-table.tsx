"use client";

import * as React from "react";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

export type MixRow = { id: number; name: string; components: string; price?: number };

const mixColumns: ColumnDef<MixRow>[] = [
  {
    accessorKey: "name",
    header: () => "Name",
    cell: ({ row }) => row.original.name,
  },
  {
    accessorKey: "components",
    header: () => "Components",
    cell: ({ row }) => row.original.components,
  },
  {
    accessorKey: "price",
    header: () => "Price",
    cell: ({ row }) => (row.original.price != null ? `Rp ${Number(row.original.price).toLocaleString("id-ID")}` : "-"),
  },
];

export function MixTable({ items }: { items: MixRow[] }) {
  const table = useDataTableInstance({ data: items, columns: mixColumns, getRowId: (r) => r.id.toString() });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Mix</CardTitle>
        <CardDescription>Komposisi mix (racikan).</CardDescription>
        <DataTableViewOptions table={table} />
      </CardHeader>
      <CardContent className="flex size-full flex-col gap-4">
        <div className="overflow-hidden rounded-md border">
          <DataTable table={table} columns={mixColumns} />
        </div>
        <DataTablePagination table={table} />
      </CardContent>
    </Card>
  );
}
