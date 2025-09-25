"use client";

import * as React from "react";
import * as XLSX from "xlsx";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { createSmartFilterFn, withIndexColumn } from "@/components/data-table/table-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

type ExpenseRow = {
  id: number | string;
  expenseDate: string;
  category: string;
  description?: string;
  amount: number;
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

export function ExpenseReport() {
  const today = React.useMemo(() => new Date(), []);
  const startDefault = React.useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10),
    [today],
  );
  const endDefault = React.useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10),
    [today],
  );

  const [start, setStart] = useQueryParamState("x_start", startDefault);
  const [end, setEnd] = useQueryParamState("x_end", endDefault);
  const [category, setCategory] = useQueryParamState("x_cat", "");
  const [rows, setRows] = React.useState<ExpenseRow[]>([]);
  const [loading, setLoading] = React.useState(false);

  const columns = React.useMemo<ColumnDef<ExpenseRow, unknown>[]>(
    () =>
      withIndexColumn<ExpenseRow>([
        { accessorKey: "expenseDate", header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" /> },
        { accessorKey: "category", header: ({ column }) => <DataTableColumnHeader column={column} title="Kategori" />, filterFn: createSmartFilterFn<ExpenseRow>() },
        { accessorKey: "description", header: ({ column }) => <DataTableColumnHeader column={column} title="Deskripsi" />, filterFn: createSmartFilterFn<ExpenseRow>() },
        {
          accessorKey: "amount",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Jumlah" />,
          cell: ({ row }) => <span className="tabular-nums">Rp {Number(row.original.amount).toLocaleString("id-ID")}</span>,
        },
      ]),
    [],
  );
  const table = useDataTableInstance({ data: rows, columns });

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (start) qs.set("start", start);
      if (end) qs.set("end", end);
      if (category) qs.set("category", category);
      const res = await fetch(`/api/expenses?${qs.toString()}`, { cache: "no-store" });
      const data = await res.json();
      const mapped: ExpenseRow[] = Array.isArray(data)
        ? data.map((x: any) => ({
            id: x.id,
            expenseDate: new Date(x.expenseDate ?? x.createdAt ?? Date.now()).toISOString().slice(0, 10),
            category: String(x.category ?? ""),
            description: x.description ?? "",
            amount: Number(x.amount ?? 0),
          }))
        : [];
      setRows(mapped);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [newDate, setNewDate] = React.useState("");
  const [newCat, setNewCat] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");
  const [newAmt, setNewAmt] = React.useState("");

  async function addExpense() {
    if (!newCat || !newAmt) return;
    const res = await fetch(`/api/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expenseDate: newDate || undefined, category: newCat, description: newDesc || undefined, amount: newAmt }),
    });
    if (res.ok) {
      setNewDate("");
      setNewCat("");
      setNewDesc("");
      setNewAmt("");
      await load();
    }
  }

  function exportExcel() {
    const data = rows.map((r) => ({
      Tanggal: r.expenseDate,
      Kategori: r.category,
      Deskripsi: r.description ?? "",
      Jumlah: r.amount,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pengeluaran");
    XLSX.writeFile(wb, `pengeluaran_${start}_sd_${end}.xlsx`);
  }

  return (
    <div className="grid min-w-0 gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <div className="grid gap-1">
          <Label>Mulai</Label>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label>Selesai</Label>
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label>Kategori</Label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Cari kategori" />
        </div>
        <div className="flex items-end gap-2">
          <Button className="w-full" onClick={() => void load()} disabled={loading}>
            {loading ? "Memuat..." : "Terapkan"}
          </Button>
          <Button className="w-full" variant="outline" onClick={exportExcel} disabled={!rows.length}>
            Export Excel
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <div className="flex items-center justify-between p-2">
          <DataTableViewOptions table={table} />
        </div>
        <DataTable table={table} columns={columns} />
        <div className="p-2">
          <DataTablePagination table={table} />
        </div>
      </div>

      <div className="rounded-md border p-3">
        <div className="mb-2 text-sm font-medium">Tambah Pengeluaran</div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
          <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} placeholder="Tanggal" />
          <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Kategori" />
          <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Deskripsi (opsional)" />
          <Input value={newAmt} onChange={(e) => setNewAmt(e.target.value)} placeholder="Jumlah (contoh: 100000)" />
          <Button onClick={addExpense}>Tambah</Button>
        </div>
      </div>
    </div>
  );
}


