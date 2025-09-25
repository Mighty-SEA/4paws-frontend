"use client";

import * as React from "react";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { withIndexColumn } from "@/components/data-table/table-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { inventoryColumns, type InventoryRow } from "./inventory-columns";

export function InventoryTable({ items }: { items: InventoryRow[] }) {
  const columns: ColumnDef<InventoryRow>[] = React.useMemo(() => withIndexColumn(inventoryColumns), []);
  const table = useDataTableInstance({ data: items, columns, getRowId: (r) => r.id.toString() });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Restock / Adjustment</CardTitle>
        <CardDescription>50 transaksi terakhir.</CardDescription>
        <DataTableViewOptions table={table} />
      </CardHeader>
      <CardContent className="flex size-full flex-col gap-4">
        <div className="overflow-hidden rounded-md border">
          <DataTable table={table} columns={columns} />
        </div>
        <DataTablePagination table={table} />
      </CardContent>
    </Card>
  );
}
