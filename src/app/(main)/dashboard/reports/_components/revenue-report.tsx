"use client";

import * as React from "react";

import type { ColumnDef } from "@tanstack/react-table";
import * as XLSX from "xlsx";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { smartFilterFn, withIndexColumn } from "@/components/data-table/table-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

type RevenueRow = {
  id: string;
  date: string;
  bookingId: number;
  ownerName?: string;
  serviceName?: string;
  method?: string;
  amount: number;
  status?: string;
};

function useQueryParamState(key: string, initial: string) {
  const [value, setValue] = React.useState<string>(() => {
    if (typeof window === "undefined") return initial;
    const url = new URL(window.location.href);
    return url.searchParams.get(key) ?? initial;
  });
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
    window.history.replaceState(null, "", `${url.pathname}?${url.searchParams.toString()}`);
  }, [key, value]);
  return [value, setValue] as const;
}

export function RevenueReport() {
  const today = React.useMemo(() => new Date(), []);
  const startDefault = React.useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10),
    [today],
  );
  const endDefault = React.useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10),
    [today],
  );

  const [start, setStart] = useQueryParamState("rv_start", startDefault);
  const [end, setEnd] = useQueryParamState("rv_end", endDefault);
  const [groupBy, setGroupBy] = useQueryParamState("rv_groupBy", "day");

  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<RevenueRow[]>([]);

  const columns = React.useMemo<ColumnDef<RevenueRow, unknown>[]>(
    () =>
      withIndexColumn<RevenueRow>([
        {
          accessorKey: "date",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
          cell: ({ row }) => <span className="tabular-nums">{row.original.date}</span>,
        },
        {
          accessorKey: "bookingId",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Booking" />,
          cell: ({ row }) => <span>#{row.original.bookingId}</span>,
        },
        {
          accessorKey: "ownerName",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Owner" />,
          filterFn: smartFilterFn,
        },
        {
          accessorKey: "serviceName",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Layanan" />,
          filterFn: smartFilterFn,
        },
        {
          accessorKey: "method",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Metode" />,
          filterFn: smartFilterFn,
        },
        {
          accessorKey: "amount",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
          cell: ({ row }) => <span className="tabular-nums">{(row.original.amount ?? 0).toLocaleString("id-ID")}</span>,
        },
        {
          accessorKey: "status",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
          filterFn: smartFilterFn,
        },
      ]),
    [],
  );

  const table = useDataTableInstance({ data: rows, columns });

  async function fetchData() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (start) qs.set("start", start);
      if (end) qs.set("end", end);
      if (groupBy) qs.set("groupBy", groupBy);
      const res = await fetch(`/api/reports/revenue?${qs.toString()}`, { cache: "no-store" });
      const data = await res.json();
      const mapped: RevenueRow[] = Array.isArray(data)
        ? data.map((d: any, idx: number) => ({
            id: String(d.id ?? idx),
            date: String(d.date ?? ""),
            bookingId: Number(d.bookingId ?? d.booking?.id ?? 0),
            ownerName: d.ownerName ?? d.booking?.owner?.name ?? undefined,
            serviceName: d.serviceName ?? d.booking?.serviceType?.name ?? undefined,
            method: d.method ?? d.paymentMethod ?? undefined,
            amount: typeof d.amount === "number" ? d.amount : Number(d.amount ?? 0),
            status: d.status ?? undefined,
          }))
        : [];
      setRows(mapped);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  const handleExportExcel = React.useCallback(() => {
    const exportRows = rows.map((r) => ({
      Tanggal: r.date,
      Booking: r.bookingId,
      Owner: r.ownerName ?? "",
      Layanan: r.serviceName ?? "",
      Metode: r.method ?? "",
      Amount: r.amount ?? 0,
      Status: r.status ?? "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pemasukan");
    const filename = `laporan-pemasukan_${start}_sd_${end}.xlsx`;
    XLSX.writeFile(workbook, filename);
  }, [rows, start, end]);

  React.useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid min-w-0 gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <div className="grid gap-1">
          <Label htmlFor="rv-start">Mulai</Label>
          <Input id="rv-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="rv-end">Selesai</Label>
          <Input id="rv-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label>Group By</Label>
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih grouping" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Per Hari</SelectItem>
              <SelectItem value="method">Per Metode</SelectItem>
              <SelectItem value="service">Per Layanan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button onClick={() => void fetchData()} disabled={loading} className="w-full">
            {loading ? "Memuat..." : "Terapkan"}
          </Button>
        </div>
      </div>

      <div className="min-w-0 rounded-md border">
        <div className="flex items-center justify-between p-2">
          <DataTableViewOptions table={table} />
          <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={!rows.length}>
            Export Excel
          </Button>
        </div>
        <DataTable table={table} columns={columns} />
        <div className="p-2">
          <DataTablePagination table={table} />
        </div>
      </div>
    </div>
  );
}
