"use client";

import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { serviceColumns, type ServiceRow } from "./service-columns";
import { serviceTypeColumns, type ServiceTypeRow } from "./service-type-columns";

export function ServiceTable({ items }: { items: ServiceRow[] }) {
  const table = useDataTableInstance({ data: items, columns: serviceColumns, getRowId: (r) => r.id.toString() });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Services</CardTitle>
        <CardDescription>Master list of services.</CardDescription>
        <CardAction>
          <DataTableViewOptions table={table} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex size-full flex-col gap-4">
        <div className="overflow-hidden rounded-md border">
          <DataTable table={table} columns={serviceColumns} />
        </div>
        <DataTablePagination table={table} />
      </CardContent>
    </Card>
  );
}

export function ServiceTypeTable({ items }: { items: ServiceTypeRow[] }) {
  const table = useDataTableInstance({ data: items, columns: serviceTypeColumns, getRowId: (r) => r.id.toString() });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Types</CardTitle>
        <CardDescription>Types with prices for each service.</CardDescription>
        <CardAction>
          <DataTableViewOptions table={table} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex size-full flex-col gap-4">
        <div className="overflow-hidden rounded-md border">
          <DataTable table={table} columns={serviceTypeColumns} />
        </div>
        <DataTablePagination table={table} />
      </CardContent>
    </Card>
  );
}
