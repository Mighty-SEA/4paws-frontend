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

export function PaymentTable({ type }: { type: "unpaid" | "paid" }) {
  const [rows, setRows] = React.useState<PaymentRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [pagination, setPagination] = React.useState({ page: 1, pageSize: 20, total: 0 });

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

  const fetchRows = React.useCallback(
    async (page = 1, pageSize = 20) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/payments?type=${type}&page=${page}&pageSize=${pageSize}`, { cache: "no-store" });
        if (!res.ok) {
          setRows([]);
          return;
        }
        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];
        setRows(items);
        setPagination({ page: data.page ?? page, pageSize: data.pageSize ?? pageSize, total: data.total ?? 0 });
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [type],
  );

  React.useEffect(() => {
    void fetchRows(1, 20);
  }, [fetchRows]);

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-end gap-2 p-2">
        <DataTableViewOptions table={table} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchRows(pagination.page, pagination.pageSize)}
          disabled={loading}
        >
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
