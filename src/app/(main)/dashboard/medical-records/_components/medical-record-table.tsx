"use client";

import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { withIndexColumn } from "@/components/data-table/table-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { medicalRecordColumns, type PetRow } from "./columns";

export function MedicalRecordTable({
  initial,
}: {
  initial: { items: PetRow[]; total: number; page: number; pageSize: number };
}) {
  const columns = React.useMemo(() => withIndexColumn(medicalRecordColumns), []);
  const table = useDataTableInstance({ data: initial.items, columns, getRowId: (r) => r.id.toString() });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Medical Records</CardTitle>
          <DataTableViewOptions table={table} />
        </div>
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
