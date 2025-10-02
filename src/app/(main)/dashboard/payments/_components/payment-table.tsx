"use client";

import * as React from "react";

import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { smartFilterFn, withIndexColumn } from "@/components/data-table/table-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

export type PaymentRow = {
  id: number;
  ownerName: string;
  serviceName: string;
  typeName?: string;
  status?: string;
  serviceSubtotal?: number;
  totalProducts?: number;
  total?: number;
  depositSum?: number;
  amountDue?: number;
};

type BookingListItemFromAPI = {
  id: number;
  owner?: { name?: string } | null;
  serviceType?: { service?: { name?: string } | null; name?: string } | null;
  status?: string;
  pets?: Array<{ examinations?: unknown[] } | null> | null;
};

type EstimateResponse = {
  serviceSubtotal?: number;
  baseService?: number;
  totalProducts?: number;
  total?: number;
  depositSum?: number;
  amountDue?: number;
};

function mapBookings(payload: unknown): Array<{
  id: number;
  ownerName: string;
  serviceName: string;
  typeName: string | undefined;
  status: string | undefined;
  hasExam: boolean;
}> {
  const arr = Array.isArray((payload as any)?.items)
    ? ((payload as any).items as unknown[] as BookingListItemFromAPI[])
    : [];
  return arr.map((b) => {
    const ownerName = b.owner?.name ?? "-";
    const serviceName = b.serviceType?.service?.name ?? "-";
    const typeName = b.serviceType?.name ?? "-";
    const status = b.status;
    const hasExam = Array.isArray(b.pets)
      ? b.pets.some((p) => Array.isArray(p?.examinations) && (p?.examinations?.length ?? 0) > 0)
      : false;
    return { id: b.id, ownerName, serviceName, typeName, status, hasExam };
  });
}

async function fetchEstimates(ids: number[]): Promise<EstimateResponse[]> {
  const res = await Promise.all(ids.map((id) => fetch(`/api/bookings/${id}/billing/estimate`, { cache: "no-store" })));
  return Promise.all(res.map((r) => (r.ok ? r.json() : ({} as EstimateResponse))));
}

export function PaymentTable({ type }: { type: "unpaid" | "paid" }) {
  const [rows, setRows] = React.useState<PaymentRow[]>([]);
  const [loading, setLoading] = React.useState(false);

  const columns = React.useMemo<ColumnDef<PaymentRow, unknown>[]>(
    () =>
      withIndexColumn<PaymentRow>([
        {
          accessorKey: "id",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Booking" />,
          cell: ({ row }) => <span>#{row.original.id}</span>,
          filterFn: smartFilterFn,
        },
        {
          accessorKey: "ownerName",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Owner" />,
          filterFn: smartFilterFn,
        },
        {
          accessorKey: "serviceName",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Layanan" />,
          cell: ({ row }) => (
            <span className="inline-flex items-center gap-2">
              {row.original.serviceName}
              {row.original.typeName ? (
                <Badge variant="secondary" className="align-middle">
                  {row.original.typeName}
                </Badge>
              ) : null}
            </span>
          ),
          filterFn: smartFilterFn,
        },
        {
          accessorKey: "serviceSubtotal",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Subtotal Layanan" />,
          cell: ({ row }) => (
            <span className="tabular-nums">Rp {(row.original.serviceSubtotal ?? 0).toLocaleString("id-ID")}</span>
          ),
        },
        {
          accessorKey: "totalProducts",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Products" />,
          cell: ({ row }) => (
            <span className="tabular-nums">Rp {(row.original.totalProducts ?? 0).toLocaleString("id-ID")}</span>
          ),
        },
        {
          accessorKey: "total",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
          cell: ({ row }) => (
            <span className="tabular-nums">Rp {(row.original.total ?? 0).toLocaleString("id-ID")}</span>
          ),
        },
        {
          accessorKey: "depositSum",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Deposit" />,
          cell: ({ row }) => (
            <span className="tabular-nums">Rp {(row.original.depositSum ?? 0).toLocaleString("id-ID")}</span>
          ),
        },
        {
          accessorKey: "amountDue",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Amount Due" />,
          cell: ({ row }) => (
            <span className="font-semibold tabular-nums">
              Rp {(row.original.amountDue ?? 0).toLocaleString("id-ID")}
            </span>
          ),
        },
        {
          id: "actions",
          header: () => <span>Aksi</span>,
          cell: ({ row }) => (
            <div className="flex items-center gap-2">
              {type === "paid" || (row.original.amountDue ?? 0) <= 0 ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/dashboard/bookings/${row.original.id}`}>View</Link>
                </Button>
              ) : (
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/dashboard/payments/${row.original.id}`}>Bayar</Link>
                </Button>
              )}
              {row.original.status === "COMPLETED" ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/dashboard/bookings/${row.original.id}/invoice`}>Invoice</Link>
                </Button>
              ) : null}
            </div>
          ),
        },
      ]),
    [type],
  );

  const table = useDataTableInstance({ data: rows, columns });

  async function fetchRows() {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?page=1&pageSize=200`, { cache: "no-store" });
      const data = await res.json();
      const baseRows = mapBookings(data);
      const estimates = await fetchEstimates(baseRows.map((r) => r.id));

      const merged: PaymentRow[] = baseRows.map((r, idx) => ({
        id: r.id,
        ownerName: r.ownerName,
        serviceName: r.serviceName,
        typeName: r.typeName,
        status: r.status,
        serviceSubtotal: Number(estimates[idx]?.serviceSubtotal ?? estimates[idx]?.baseService ?? 0),
        totalProducts: Number(estimates[idx]?.totalProducts ?? 0),
        total: Number(estimates[idx]?.total ?? 0),
        depositSum: Number(estimates[idx]?.depositSum ?? 0),
        amountDue: Number(estimates[idx]?.amountDue ?? 0),
      }));

      // Filter based on type
      const filtered =
        type === "unpaid"
          ? merged.filter((r) => (r.amountDue ?? 0) > 0 && r.status !== "COMPLETED")
          : merged.filter((r) => r.status === "COMPLETED" || (r.amountDue ?? 0) <= 0);

      setRows(filtered);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-end gap-2 p-2">
        <DataTableViewOptions table={table} />
        <Button variant="outline" size="sm" onClick={() => void fetchRows()} disabled={loading}>
          {loading ? "Memuat..." : "Reload"}
        </Button>
      </div>
      <DataTable table={table} columns={columns} />
      <div className="p-2">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
