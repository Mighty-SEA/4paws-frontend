"use client";

import * as React from "react";

import type { ColumnDef } from "@tanstack/react-table";
import * as XLSX from "xlsx";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { createSmartFilterFn, withIndexColumn } from "@/components/data-table/table-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

type MedicineUsageRow = {
  id: string;
  date: string;
  productName: string;
  bookingId: number;
  ownerName?: string;
  petName?: string;
  quantity: number;
  unit?: string;
  cost?: number;
};
type MedicineUsageSummaryRow = {
  productName: string;
  timesUsed: number;
  totalPrimaryQty: number;
  totalInnerQty: number;
  totalCost: number;
  unit?: string;
  innerUnit?: string;
  denom?: number;
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

export function MedicineUsageReport() {
  const today = React.useMemo(() => new Date(), []);
  const startDefault = React.useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10),
    [today],
  );
  const endDefault = React.useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10),
    [today],
  );

  const [start, setStart] = useQueryParamState("mu_start", startDefault);
  const [end, setEnd] = useQueryParamState("mu_end", endDefault);
  const [groupBy, setGroupBy] = useQueryParamState("mu_groupBy", "day");
  const [sources, setSources] = React.useState<string[]>(["visit", "exam", "mix"]);

  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<MedicineUsageRow[]>([]);
  const [summaryRows, setSummaryRows] = React.useState<MedicineUsageSummaryRow[]>([]);
  const [mode, setMode] = React.useState<"detail" | "summary">("summary");

  const columns = React.useMemo<ColumnDef<MedicineUsageRow, unknown>[]>(
    () =>
      withIndexColumn<MedicineUsageRow>([
        {
          accessorKey: "date",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
          cell: ({ row }) => <span className="tabular-nums">{row.original.date}</span>,
        },
        {
          accessorKey: "productName",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Produk" />,
          filterFn: createSmartFilterFn<MedicineUsageRow>(),
        },
        {
          accessorKey: "bookingId",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Booking" />,
          cell: ({ row }) => <span>#{row.original.bookingId}</span>,
        },
        {
          accessorKey: "ownerName",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Owner" />,
          filterFn: createSmartFilterFn<MedicineUsageRow>(),
        },
        {
          accessorKey: "petName",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Hewan" />,
          filterFn: createSmartFilterFn<MedicineUsageRow>(),
        },
        {
          accessorKey: "quantity",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Qty" />,
          cell: ({ row }) => <span className="tabular-nums">{row.original.quantity}</span>,
        },
        {
          accessorKey: "unit",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Satuan" />,
          filterFn: createSmartFilterFn<MedicineUsageRow>(),
        },
        {
          accessorKey: "cost",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Biaya" />,
          cell: ({ row }) => <span className="tabular-nums">{(row.original.cost ?? 0).toLocaleString("id-ID")}</span>,
        },
      ]),
    [],
  );

  const table = useDataTableInstance({ data: rows, columns });
  const summaryColumns = React.useMemo<ColumnDef<MedicineUsageSummaryRow, unknown>[]>(
    () =>
      withIndexColumn<MedicineUsageSummaryRow>([
        {
          accessorKey: "productName",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Produk" />,
        },
        {
          accessorKey: "timesUsed",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Dipakai (kali)" />,
          cell: ({ row }) => (
            <span className="tabular-nums">
              {new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(row.original.timesUsed)}
            </span>
          ),
        },
        {
          accessorKey: "totalPrimaryQty",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Total Unit Utama" />,
          cell: ({ row }) => (
            <span className="tabular-nums">
              {new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(row.original.totalPrimaryQty)}
            </span>
          ),
        },
        {
          accessorKey: "totalInnerQty",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Total Isi per Unit" />,
          cell: ({ row }) => (
            <span className="tabular-nums">
              {new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(row.original.totalInnerQty)}
            </span>
          ),
        },
        {
          accessorKey: "totalCost",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Total Biaya" />,
          cell: ({ row }) => (
            <span className="tabular-nums">
              {new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(row.original.totalCost)}
            </span>
          ),
        },
      ]),
    [],
  );
  const summaryTable = useDataTableInstance({
    data: summaryRows,
    columns: summaryColumns,
    getRowId: (row, idx) => `${row.productName}|${idx}`,
  });

  async function fetchData() {
    setLoading(true);
    try {
      const toStringSafe = (v: unknown): string => (v == null ? "" : String(v));
      const toNumberSafe = (v: unknown): number => {
        const n = typeof v === "number" ? v : Number(v ?? 0);
        return Number.isFinite(n) ? n : 0;
      };
      const toIdSafe = (v: unknown): number => {
        const n = Number(v ?? 0);
        return Number.isInteger(n) ? n : 0;
      };
      const qs = new URLSearchParams();
      if (start) qs.set("start", start);
      if (end) qs.set("end", end);
      if (groupBy) qs.set("groupBy", groupBy);
      if (sources.includes("visit")) qs.append("sourceType", "visit");
      if (sources.includes("exam")) qs.append("sourceType", "exam");
      if (sources.includes("mix")) qs.append("sourceType", "mix");
      if (mode === "summary") {
        qs.set("mode", "summary");
      }
      const res = await fetch(`/api/reports/product-usage?${qs.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (mode === "summary") {
        const mapped: MedicineUsageSummaryRow[] = Array.isArray(data)
          ? data.map((d: any) => ({
              productName: String(d?.productName ?? "-"),
              timesUsed: Number(d?.timesUsed ?? 0),
              totalPrimaryQty: Number(d?.totalPrimaryQty ?? 0),
              totalInnerQty: Number(d?.totalInnerQty ?? 0),
              totalCost: Number(d?.totalCost ?? 0),
              unit: d?.unit ? String(d.unit) : undefined,
              innerUnit: d?.innerUnit ? String(d.innerUnit) : undefined,
              denom: d?.denom != null ? Number(d.denom) : undefined,
            }))
          : [];
        setSummaryRows(mapped);
        setRows([]);
        return;
      }
      const mapped: MedicineUsageRow[] = Array.isArray(data)
        ? data.map((d: unknown, idx: number) => {
            const obj = (d ?? {}) as Record<string, unknown>;
            const booking = (obj.booking ?? {}) as Record<string, unknown>;
            const product = (obj.product ?? {}) as Record<string, unknown>;
            return {
              id: toStringSafe(obj.id ?? idx),
              date: toStringSafe(obj.date),
              productName: toStringSafe(obj.productName ?? product.name ?? "-"),
              bookingId: toIdSafe(obj.bookingId ?? booking.id),
              ownerName: toStringSafe(obj.ownerName ?? (booking.owner as any)?.name) || undefined,
              petName: toStringSafe(obj.petName ?? (booking.pet as any)?.name) || undefined,
              quantity: toNumberSafe(obj.quantity),
              unit: toStringSafe(obj.unit ?? product.unit) || undefined,
              cost: toNumberSafe(obj.cost),
            };
          })
        : [];
      setRows(mapped);
      setSummaryRows([]);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  const handleExportExcel = React.useCallback(() => {
    if (mode === "summary") {
      const exportRows = summaryRows.map((r) => ({
        Produk: r.productName,
        "Dipakai (kali)": r.timesUsed,
        "Total Unit Utama": r.totalPrimaryQty,
        "Total Isi per Unit": r.totalInnerQty,
        "Total Biaya": r.totalCost,
        Satuan: r.unit ?? "",
        "Isi per Unit": r.innerUnit ?? "",
        Denom: r.denom ?? "",
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Ringkasan Penggunaan Produk");
      const filename = `laporan-penggunaan-produk_ringkasan_${start}_sd_${end}.xlsx`;
      XLSX.writeFile(workbook, filename);
      return;
    }
    const exportRows = rows.map((r) => ({
      Tanggal: r.date,
      Produk: r.productName,
      Booking: r.bookingId,
      Owner: r.ownerName ?? "",
      Hewan: r.petName ?? "",
      Qty: r.quantity,
      Satuan: r.unit ?? "",
      Biaya: r.cost ?? 0,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Penggunaan Produk");
    const filename = `laporan-penggunaan-produk_${start}_sd_${end}.xlsx`;
    XLSX.writeFile(workbook, filename);
  }, [mode, summaryRows, rows, start, end]);

  React.useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <div className="grid min-w-0 gap-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-7">
        <div className="grid gap-1">
          <Label htmlFor="mu-start">Mulai</Label>
          <Input id="mu-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="mu-end">Selesai</Label>
          <Input id="mu-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label>Group By</Label>
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih grouping" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Per Hari</SelectItem>
              <SelectItem value="product">Per Produk</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1 md:col-span-2 lg:col-span-3">
          <Label>Sumber</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <ToggleGroup
              type="multiple"
              variant="outline"
              size="sm"
              value={sources}
              onValueChange={(v) => setSources(v)}
              className="w-full sm:flex-1"
            >
              <ToggleGroupItem value="visit" aria-label="Visit">
                Visit
              </ToggleGroupItem>
              <ToggleGroupItem value="exam" aria-label="Pemeriksaan">
                Pemeriksaan
              </ToggleGroupItem>
              <ToggleGroupItem value="mix" aria-label="Product Mix">
                Product Mix
              </ToggleGroupItem>
            </ToggleGroup>
            <Button onClick={() => void fetchData()} disabled={loading} className="w-full shrink-0 sm:w-auto">
              {loading ? "Memuat..." : "Terapkan"}
            </Button>
          </div>
        </div>
        {/* Mode selector moved to table header */}
      </div>

      <div className="min-w-0 rounded-md border">
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <Select value={mode} onValueChange={(v) => setMode(v as any)}>
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue placeholder="Pilih mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="detail">Detail</SelectItem>
                <SelectItem value="summary">Ringkasan</SelectItem>
              </SelectContent>
            </Select>
            {mode === "summary" ? (
              <DataTableViewOptions table={summaryTable} />
            ) : (
              <DataTableViewOptions table={table} />
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={mode === "summary" ? !summaryRows.length : !rows.length}
          >
            Export Excel
          </Button>
        </div>
        {mode === "summary" ? (
          <DataTable table={summaryTable} columns={summaryColumns} />
        ) : (
          <DataTable table={table} columns={columns} />
        )}
        <div className="p-2">
          {mode === "summary" ? <DataTablePagination table={summaryTable} /> : <DataTablePagination table={table} />}
        </div>
      </div>
    </div>
  );
}
