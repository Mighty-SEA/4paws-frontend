"use client";

import * as React from "react";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { createSmartFilterFn, withIndexColumn } from "@/components/data-table/table-utils";
import { Button } from "@/components/ui/button";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

type DepositRow = {
  id: number | string;
  depositDate: string;
  method?: string;
  amount: number;
};

export function DepositsTable({ bookingId, items }: { bookingId: number; items: unknown[] }) {
  const rows = React.useMemo<DepositRow[]>(
    () =>
      (Array.isArray(items) ? items : []).map((d: unknown) => {
        const deposit = d as Record<string, unknown>;
        const toDateLike = (v: unknown): string | number | Date | null => {
          if (typeof v === "string" || typeof v === "number" || v instanceof Date) return v;
          return null;
        };
        const rawId = deposit.id;
        const id: number | string =
          typeof rawId === "number" || typeof rawId === "string"
            ? rawId
            : String(deposit.depositDate ?? deposit.createdAt ?? "");
        const method: string = typeof deposit.method === "string" ? deposit.method : "";
        const rawDate =
          toDateLike(deposit.depositDate) ?? toDateLike(deposit.createdAt) ?? (Date.now() as number | string | Date);
        return {
          id,
          depositDate: new Date(rawDate).toISOString().slice(0, 19).replace("T", " "),
          method,
          amount: Number(deposit.amount ?? 0),
        };
      }),
    [items],
  );

  const columns = React.useMemo<ColumnDef<DepositRow, unknown>[]>(
    () =>
      withIndexColumn<DepositRow>([
        {
          accessorKey: "depositDate",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
          cell: ({ row }) => <span className="tabular-nums">{row.original.depositDate}</span>,
        },
        {
          accessorKey: "method",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Metode" />,
          filterFn: createSmartFilterFn<DepositRow>(),
        },
        {
          accessorKey: "amount",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Nominal" />,
          cell: ({ row }) => (
            <span className="tabular-nums">Rp {Number(row.original.amount).toLocaleString("id-ID")}</span>
          ),
        },
        {
          id: "actions",
          header: () => <span className="sr-only">Aksi</span>,
          cell: ({ row }) => <RowActions bookingId={bookingId} id={row.original.id} />,
        },
      ]),
    [bookingId],
  );

  const table = useDataTableInstance({ data: rows, columns, getRowId: (r) => String(r.id) });

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <DataTableViewOptions table={table} />
      </div>
      <div className="overflow-hidden rounded-md border">
        <DataTable table={table} columns={columns} />
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}

function RowActions({ bookingId, id }: { bookingId: number; id: number | string }) {
  const [loading, setLoading] = React.useState(false);
  async function onDelete() {
    const ok = window.confirm("Hapus deposit ini?");
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/deposits?id=${id}`, { method: "DELETE" });
      if (!res.ok) return;
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="flex justify-end">
      <Button size="sm" variant="outline" onClick={onDelete} disabled={loading}>
        {loading ? "Menghapus..." : "Hapus"}
      </Button>
    </div>
  );
}
