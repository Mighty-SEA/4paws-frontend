"use client";

import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { withIndexColumn } from "@/components/data-table/table-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { bookingColumns, type BookingRow } from "./columns";

export function BookingTable({
  initial,
}: {
  initial: { items: BookingRow[]; total: number; page: number; pageSize: number };
}) {
  const columns = React.useMemo(() => withIndexColumn(bookingColumns), []);
  const table = useDataTableInstance({ data: initial.items, columns, getRowId: (r) => r.id.toString() });

  const services = React.useMemo(() => {
    const set = new Set(initial.items.map((r) => r.serviceName).filter(Boolean));
    return Array.from(set);
  }, [initial.items]);
  const statuses = React.useMemo(() => {
    const set = new Set(initial.items.map((r) => r.status).filter(Boolean));
    return Array.from(set);
  }, [initial.items]);
  const serviceCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const r of initial.items) {
      const key = String(r.serviceName ?? "");
      if (!key) continue;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [initial.items]);
  const statusCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const r of initial.items) {
      const key = String(r.status ?? "");
      if (!key) continue;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
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
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex max-w-full items-center gap-2">
              <button
                type="button"
                onClick={() => setServiceFilter("")}
                className={`rounded-md border px-3 py-2 text-left text-sm ${!activeService ? "border-primary bg-primary/10" : "hover:bg-muted"}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="font-medium">Semua</div>
                  <div className="bg-secondary rounded px-2 py-0.5 text-xs">{initial.items.length}</div>
                </div>
              </button>
              <div className="flex w-full gap-2 overflow-x-auto">
                {services.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setServiceFilter(s)}
                    className={`flex-none rounded-md border px-3 py-2 text-left text-sm ${activeService === s ? "border-primary bg-primary/10" : "hover:bg-muted"}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="max-w-[180px] truncate font-medium">{s}</div>
                      <div className="bg-secondary rounded px-2 py-0.5 text-xs">{serviceCounts.get(s) ?? 0}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex max-w-full items-center gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter("")}
                className={`rounded-md border px-3 py-2 text-left text-sm ${!activeStatus ? "border-primary bg-primary/10" : "hover:bg-muted"}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="font-medium">Semua</div>
                  <div className="bg-secondary rounded px-2 py-0.5 text-xs">{initial.items.length}</div>
                </div>
              </button>
              <div className="flex w-full gap-2 overflow-x-auto">
                {statuses.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`flex-none rounded-md border px-3 py-2 text-left text-sm ${activeStatus === st ? "border-primary bg-primary/10" : "hover:bg-muted"}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="max-w-[180px] truncate font-medium">{st}</div>
                      <div className="bg-secondary rounded px-2 py-0.5 text-xs">{statusCounts.get(st) ?? 0}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center">
            <DataTableViewOptions table={table} />
          </div>
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
