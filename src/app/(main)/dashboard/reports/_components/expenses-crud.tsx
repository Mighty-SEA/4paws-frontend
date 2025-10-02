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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

type ExpenseRow = {
  id: number;
  expenseDate: string; // YYYY-MM-DD
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

export function ExpensesCrud() {
  const today = React.useMemo(() => new Date(), []);
  const formatLocalDate = React.useCallback((d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);
  const startDefault = React.useMemo(
    () => formatLocalDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    [today, formatLocalDate],
  );
  const endDefault = React.useMemo(
    () => formatLocalDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
    [today, formatLocalDate],
  );

  const [start, setStart] = useQueryParamState("ex_start", startDefault);
  const [end, setEnd] = useQueryParamState("ex_end", endDefault);
  const [q, setQ] = useQueryParamState("ex_q", "");

  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<ExpenseRow[]>([]);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [total, setTotal] = React.useState(0);

  const [openDialog, setOpenDialog] = React.useState<null | { mode: "create" } | { mode: "edit"; row: ExpenseRow }>(
    null,
  );
  const [form, setForm] = React.useState<{ expenseDate: string; description: string; amount: string }>(() => ({
    expenseDate: new Date().toISOString().slice(0, 10),
    description: "",
    amount: "0",
  }));

  const totalExpenses = React.useMemo(() => rows.reduce((s, r) => s + Number(r.amount ?? 0), 0), [rows]);

  const columns = React.useMemo<ColumnDef<ExpenseRow, unknown>[]>(
    () =>
      withIndexColumn<ExpenseRow>([
        {
          accessorKey: "expenseDate",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
          cell: ({ row }) => <span className="tabular-nums">{row.original.expenseDate}</span>,
        },
        {
          accessorKey: "description",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Deskripsi" />,
          filterFn: createSmartFilterFn<ExpenseRow>(),
        },
        {
          accessorKey: "amount",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Jumlah" />,
          cell: ({ row }) => (
            <span className="tabular-nums">{Number(row.original.amount).toLocaleString("id-ID")}</span>
          ),
        },
        {
          id: "actions",
          header: () => <span>Aksi</span>,
          cell: ({ row }) => (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const r = row.original;
                  setForm({ expenseDate: r.expenseDate, description: r.description ?? "", amount: String(r.amount) });
                  setOpenDialog({ mode: "edit", row: r });
                }}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  if (!confirm("Hapus pengeluaran ini?")) return;
                  const res = await fetch(`/api/expenses/${row.original.id}`, { method: "DELETE" });
                  if (res.ok) {
                    setRows((prev) => prev.filter((x) => x.id !== row.original.id));
                    setTotal((t) => Math.max(0, t - 1));
                  }
                }}
              >
                Hapus
              </Button>
            </div>
          ),
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
      if (q) qs.set("q", q);
      qs.set("page", String(page));
      qs.set("pageSize", String(pageSize));
      const res = await fetch(`/api/expenses?${qs.toString()}`, { cache: "no-store" });
      const data = await res.json();
      const items: any[] = Array.isArray(data?.items) ? data.items : [];
      const mapped: ExpenseRow[] = items.map((d) => ({
        id: Number(d.id),
        expenseDate: String(d.expenseDate).slice(0, 10),
        description: d.description ? String(d.description) : undefined,
        amount: Number(d.amount ?? 0),
      }));
      setRows(mapped);
      setTotal(Number(data?.total ?? mapped.length));
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  function resetForm() {
    setForm({ expenseDate: new Date().toISOString().slice(0, 10), description: "", amount: "0" });
  }

  async function handleSubmit() {
    const payload = {
      expenseDate: form.expenseDate,
      description: form.description?.trim() || undefined,
      amount: Number(form.amount),
    };
    if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
      alert("Jumlah harus lebih dari 0");
      return;
    }
    if (openDialog?.mode === "create") {
      const res = await fetch(`/api/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        resetForm();
        setOpenDialog(null);
        void fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err?.message ?? "Gagal menyimpan pengeluaran");
      }
    } else if (openDialog?.mode === "edit") {
      const id = openDialog.row.id;
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        resetForm();
        setOpenDialog(null);
        void fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err?.message ?? "Gagal menyimpan perubahan");
      }
    }
  }

  const handleExportExcel = React.useCallback(() => {
    const exportRows = rows.map((r) => ({
      Tanggal: r.expenseDate,
      Deskripsi: r.description ?? "",
      Amount: r.amount,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pengeluaran");
    const filename = `laporan-pengeluaran_${start}_sd_${end}.xlsx`;
    XLSX.writeFile(workbook, filename);
  }, [rows, start, end]);

  return (
    <div className="grid min-w-0 gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        <div className="grid gap-1">
          <Label htmlFor="ex-start">Mulai</Label>
          <Input id="ex-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="ex-end">Selesai</Label>
          <Input id="ex-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="grid gap-1 md:col-span-2 lg:col-span-3">
          <Label htmlFor="ex-q">Cari Deskripsi</Label>
          <Input id="ex-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari..." />
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={() => void fetchData()} disabled={loading} className="w-full">
            {loading ? "Memuat..." : "Terapkan"}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setOpenDialog({ mode: "create" })}>
            Tambah
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
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2 text-sm">
            <span>Page</span>
            <Input
              type="number"
              className="h-8 w-16"
              value={page}
              onChange={(e) => setPage(Math.max(1, Number(e.target.value || 1)))}
            />
            <span className="text-muted-foreground">/ {Math.max(1, Math.ceil(total / pageSize))}</span>
            <span className="ml-2">Page size</span>
            <Input
              type="number"
              className="h-8 w-16"
              value={pageSize}
              onChange={(e) => setPageSize(Math.min(100, Math.max(1, Number(e.target.value || 20))))}
            />
          </div>
          <div className="text-sm font-medium">
            <span className="mr-2">Total Pengeluaran:</span>
            <span className="tabular-nums">Rp {Number(totalExpenses).toLocaleString("id-ID")}</span>
          </div>
        </div>
        <div className="p-2">
          <DataTablePagination table={table} />
        </div>
      </div>

      <Dialog open={!!openDialog} onOpenChange={(o) => !o && setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{openDialog?.mode === "edit" ? "Edit Pengeluaran" : "Tambah Pengeluaran"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1">
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={form.expenseDate}
                onChange={(e) => setForm((f) => ({ ...f, expenseDate: e.target.value }))}
              />
            </div>
            <div className="grid gap-1">
              <Label>Deskripsi</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid gap-1">
              <Label>Jumlah</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                min="0"
                step="1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenDialog(null)}>
                Batal
              </Button>
              <Button onClick={() => void handleSubmit()} disabled={Number(form.amount) <= 0}>
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
