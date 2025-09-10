"use client";

import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { bookingColumns, type BookingRow } from "./columns";

export function BookingTable({
  initial,
}: {
  initial: { items: BookingRow[]; total: number; page: number; pageSize: number };
}) {
  const table = useDataTableInstance({
    data: initial.items,
    columns: bookingColumns,
    getRowId: (r) => r.id.toString(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookings</CardTitle>
        <CardDescription>Recent bookings.</CardDescription>
        <CardAction>
          <div className="flex items-center gap-2">
            <DataTableViewOptions table={table} />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="flex size-full flex-col gap-4">
        <div className="overflow-hidden rounded-md border">
          <DataTable table={table} columns={bookingColumns} />
        </div>
        <DataTablePagination table={table} />
      </CardContent>
    </Card>
  );
}
