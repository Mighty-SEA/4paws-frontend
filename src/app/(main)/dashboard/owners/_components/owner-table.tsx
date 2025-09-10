"use client";

import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { ownerColumns, type OwnerRow } from "./columns";
import { NewOwnerInline } from "./new-owner-inline";

export function OwnerTable({
  initial,
}: {
  initial: { items: OwnerRow[]; total: number; page: number; pageSize: number };
}) {
  const [data, setData] = React.useState(initial);

  const table = useDataTableInstance({
    data: data.items,
    columns: ownerColumns,
    getRowId: (row) => row.id.toString(),
  });

  async function refresh() {
    const res = await fetch(`/api/owners?page=${data.page}&pageSize=${data.pageSize}`, { cache: "no-store" });
    if (res.ok) setData(await res.json());
  }

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs">
      <Card>
        <CardHeader>
          <CardTitle>Owners</CardTitle>
          <CardDescription>Manage pet owners and their pets.</CardDescription>
          <CardAction>
            <div className="flex items-center gap-2">
              <DataTableViewOptions table={table} />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex size-full flex-col gap-4">
          <NewOwnerInline onCreated={refresh} />
          <div className="overflow-hidden rounded-md border">
            <DataTable table={table} columns={ownerColumns} />
          </div>
          <DataTablePagination table={table} />
        </CardContent>
      </Card>
    </div>
  );
}
