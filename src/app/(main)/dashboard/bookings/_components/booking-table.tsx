"use client";

import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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

  const services = React.useMemo(() => {
    const set = new Set(initial.items.map((r) => r.serviceName).filter(Boolean));
    return Array.from(set);
  }, [initial.items]);
  const statuses = React.useMemo(() => {
    const set = new Set(initial.items.map((r) => r.status).filter(Boolean));
    return Array.from(set);
  }, [initial.items]);

  function setServiceFilter(name: string) {
    const col = table.getColumn("serviceName");
    if (!col) return;
    col.setFilterValue(name);
  }
  function setStatusFilter(status: string) {
    const col = table.getColumn("status");
    if (!col) return;
    col.setFilterValue(status);
  }
  const activeService = String(table.getColumn("serviceName")?.getFilterValue() ?? "");
  const activeStatus = String(table.getColumn("status")?.getFilterValue() ?? "");

  return (
    <Card>
      <CardHeader>
        <div className="flex w-full flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 max-w-full">
              <Button
                size="sm"
                variant={!activeService ? "secondary" : "outline"}
                onClick={() => setServiceFilter("")}
                className="shrink-0"
              >
                Semua
              </Button>
              <div className="w-full overflow-x-auto">
                <ToggleGroup
                  type="single"
                  value={activeService}
                  onValueChange={(v) => setServiceFilter(v ?? "")}
                  variant="outline"
                  size="sm"
                  className="inline-flex min-w-max"
                >
                  {services.map((s) => (
                    <ToggleGroupItem key={s} value={s} aria-label={s} className="flex-none whitespace-nowrap">
                      {s}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>
            <div className="flex items-center gap-2 max-w-full">
              <Button
                size="sm"
                variant={!activeStatus ? "secondary" : "outline"}
                onClick={() => setStatusFilter("")}
                className="shrink-0"
              >
                Semua
              </Button>
              <div className="w-full overflow-x-auto">
                <ToggleGroup
                  type="single"
                  value={activeStatus}
                  onValueChange={(v) => setStatusFilter(v ?? "")}
                  variant="outline"
                  size="sm"
                  className="inline-flex min-w-max"
                >
                  {statuses.map((st) => (
                    <ToggleGroupItem key={st} value={st} aria-label={st} className="flex-none whitespace-nowrap">
                      {st}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center"><DataTableViewOptions table={table} /></div>
        </div>
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

