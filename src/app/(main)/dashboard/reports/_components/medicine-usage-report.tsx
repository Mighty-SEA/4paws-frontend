"use client";

import * as React from "react";

import type { ColumnDef } from "@tanstack/react-table";
import * as XLSX from "xlsx";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [productIdsCsv, setProductIdsCsv] = useQueryParamState("mu_productIds", "");
  const [srcVisit, setSrcVisit] = React.useState(true);
  const [srcExam, setSrcExam] = React.useState(true);
  const [srcMix, setSrcMix] = React.useState(true);

  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<MedicineUsageRow[]>([]);

  const columns = React.useMemo<ColumnDef<MedicineUsageRow, any>[]>(
    () => [
      {
        accessorKey: "date",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
        cell: ({ row }) => <span className="tabular-nums">{row.original.date}</span>,
      },
      {
        accessorKey: "productName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Produk" />,
      },
      {
        accessorKey: "bookingId",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Booking" />,
        cell: ({ row }) => <span>#{row.original.bookingId}</span>,
      },
      {
        accessorKey: "ownerName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Owner" />,
      },
      {
        accessorKey: "petName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Hewan" />,
      },
      {
        accessorKey: "quantity",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Qty" />,
        cell: ({ row }) => <span className="tabular-nums">{row.original.quantity}</span>,
      },
      {
        accessorKey: "unit",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Satuan" />,
      },
      {
        accessorKey: "cost",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Biaya" />,
        cell: ({ row }) => <span className="tabular-nums">{(row.original.cost ?? 0).toLocaleString("id-ID")}</span>,
      },
    ],
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
      if (productIdsCsv) for (const pid of productIdsCsv.split(",").filter(Boolean)) qs.append("productId", pid.trim());
      if (srcVisit) qs.append("sourceType", "visit");
      if (srcExam) qs.append("sourceType", "exam");
      if (srcMix) qs.append("sourceType", "mix");
      const res = await fetch(`/api/reports/product-usage?${qs.toString()}`, { cache: "no-store" });
      const data = await res.json();
      const mapped: MedicineUsageRow[] = Array.isArray(data)
        ? data.map((d: any, idx: number) => ({
            id: String(d.id ?? idx),
            date: String(d.date ?? ""),
            productName: String(d.productName ?? d.product?.name ?? "-"),
            bookingId: Number(d.bookingId ?? d.booking?.id ?? 0),
            ownerName: d.ownerName ?? d.booking?.owner?.name ?? d.owner?.name ?? undefined,
            petName: d.petName ?? d.booking?.pet?.name ?? undefined,
            quantity: Number(d.quantity ?? 0),
            unit: d.unit ?? d.product?.unit ?? undefined,
            cost: typeof d.cost === "number" ? d.cost : Number(d.cost ?? 0),
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
    const suffix = productIdsCsv ? `_produk_${productIdsCsv.replace(/,/g, "-")}` : "";
    const filename = `laporan-penggunaan-produk_${start}_sd_${end}${suffix}.xlsx`;
    XLSX.writeFile(workbook, filename);
  }, [rows, start, end, productIdsCsv]);

  React.useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
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
        <div className="grid gap-1">
          <Label htmlFor="mu-products">Produk IDs (CSV, opsional)</Label>
          <Input
            id="mu-products"
            placeholder="mis. 12,34,56"
            value={productIdsCsv}
            onChange={(e) => setProductIdsCsv(e.target.value)}
          />
        </div>
        <div className="grid gap-1">
          <Label>Sumber</Label>
          <div className="flex items-center gap-3 py-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={srcVisit} onCheckedChange={(v) => setSrcVisit(Boolean(v))} /> Visit
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={srcExam} onCheckedChange={(v) => setSrcExam(Boolean(v))} /> Pemeriksaan
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={srcMix} onCheckedChange={(v) => setSrcMix(Boolean(v))} /> Product Mix
            </label>
          </div>
        </div>
        <div className="flex items-end">
          <Button onClick={() => void fetchData()} disabled={loading} className="w-full">
            {loading ? "Memuat..." : "Terapkan"}
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
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
