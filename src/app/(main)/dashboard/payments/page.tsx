"use client";

import * as React from "react";

import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

type PaymentRow = {
  id: number;
  ownerName: string;
  serviceName: string;
  typeName?: string;
  status?: string;
  baseService?: number;
  totalProducts?: number;
  total?: number;
  depositSum?: number;
  amountDue?: number;
};

export default function PaymentsPage() {
  const [tab, setTab] = React.useState("unpaid");
  const [rowsUnpaid, setRowsUnpaid] = React.useState<PaymentRow[]>([]);
  const [rowsPaid, setRowsPaid] = React.useState<PaymentRow[]>([]);
  const [loading, setLoading] = React.useState(false);

  const columns = React.useMemo<ColumnDef<PaymentRow, any>[]>(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Booking" />,
        cell: ({ row }) => <span>#{row.original.id}</span>,
      },
      {
        accessorKey: "ownerName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Owner" />,
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
      },
      {
        accessorKey: "baseService",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Jasa Layanan" />,
        cell: ({ row }) => (
          <span className="tabular-nums">Rp {(row.original.baseService ?? 0).toLocaleString("id-ID")}</span>
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
        cell: ({ row }) => <span className="tabular-nums">Rp {(row.original.total ?? 0).toLocaleString("id-ID")}</span>,
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
          <span className="font-semibold tabular-nums">Rp {(row.original.amountDue ?? 0).toLocaleString("id-ID")}</span>
        ),
      },
      {
        id: "actions",
        header: () => <span>Aksi</span>,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {tab === "paid" || (row.original.amountDue ?? 0) <= 0 ? (
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
    ],
    [tab],
  );

  const data = tab === "paid" ? rowsPaid : rowsUnpaid;
  const table = useDataTableInstance({ data, columns });

  async function fetchRows() {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?page=1&pageSize=100`, { cache: "no-store" });
      const data = await res.json();
      const rawRows = Array.isArray(data?.items)
        ? data.items
            .map((b: any) => ({
              id: b.id,
              ownerName: b.owner?.name ?? "-",
              serviceName: b.serviceType?.service?.name ?? "-",
              typeName: b.serviceType?.name ?? "-",
              status: b.status,
              hasExam: Array.isArray(b.pets)
                ? b.pets.some((p: any) => Array.isArray(p.examinations) && p.examinations.length > 0)
                : false,
            }))
            .filter((r: any) => r.hasExam)
        : [];

      // load estimates in parallel
      const estimatesRes = await Promise.all(
        rawRows.map((r: any) => fetch(`/api/bookings/${r.id}/billing/estimate`, { cache: "no-store" })),
      );
      const estimates = await Promise.all(estimatesRes.map((r) => (r.ok ? r.json() : null)));

      const merged: PaymentRow[] = rawRows.map((r: any, idx: number) => ({
        id: r.id,
        ownerName: r.ownerName,
        serviceName: r.serviceName,
        typeName: r.typeName,
        status: r.status,
        baseService: Number(estimates[idx]?.baseService ?? 0),
        totalProducts: Number(estimates[idx]?.totalProducts ?? 0),
        total: Number(estimates[idx]?.total ?? 0),
        depositSum: Number(estimates[idx]?.depositSum ?? 0),
        amountDue: Number(estimates[idx]?.amountDue ?? 0),
      }));

      const unpaid = merged.filter((r) => (r.amountDue ?? 0) > 0 && r.status !== "COMPLETED");
      const paid = merged.filter((r) => r.status === "COMPLETED" || (r.amountDue ?? 0) <= 0);

      setRowsUnpaid(unpaid);
      setRowsPaid(paid);
    } catch {
      setRowsUnpaid([]);
      setRowsPaid([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void fetchRows();
  }, []);

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pembayaran</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Daftar tagihan dari booking yang sudah ada tindakan, tetapi belum dibayar.
      </p>
      <Card className="overflow-x-hidden">
        <CardHeader>
          <CardTitle>Pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <div className="flex items-center justify-between p-2">
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <div className="flex items-center justify-between gap-2">
                <TabsList>
                  <TabsTrigger value="unpaid">Belum Lunas</TabsTrigger>
                  <TabsTrigger value="paid">Lunas</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                  <DataTableViewOptions table={table} />
                  <Button variant="outline" size="sm" onClick={() => void fetchRows()} disabled={loading}>
                    {loading ? "Memuat..." : "Reload"}
                  </Button>
                </div>
              </div>
              <TabsContent value="unpaid" className="mt-2">
                <DataTable table={table} columns={columns} />
                <div className="p-2">
                  <DataTablePagination table={table} />
                </div>
              </TabsContent>
              <TabsContent value="paid" className="mt-2">
                <DataTable table={table} columns={columns} />
                <div className="p-2">
                  <DataTablePagination table={table} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
