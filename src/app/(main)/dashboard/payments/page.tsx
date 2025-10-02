"use client";

import * as React from "react";

import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";
import { Settings } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { smartFilterFn, withIndexColumn } from "@/components/data-table/table-utils";
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
  serviceSubtotal?: number;
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
  const [statsLoading, setStatsLoading] = React.useState(false);
  const [todaySum, setTodaySum] = React.useState(0);
  const [todayCount, setTodayCount] = React.useState(0);
  const [monthSum, setMonthSum] = React.useState(0);
  const [monthCount, setMonthCount] = React.useState(0);

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
      ]),
    [tab],
  );

  const data = tab === "paid" ? rowsPaid : rowsUnpaid;
  const table = useDataTableInstance({ data, columns });

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
    const res = await Promise.all(
      ids.map((id) => fetch(`/api/bookings/${id}/billing/estimate`, { cache: "no-store" })),
    );
    return Promise.all(res.map((r) => (r.ok ? r.json() : ({} as EstimateResponse))));
  }

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

      // Unpaid: amountDue > 0 and not COMPLETED. Include IN_PROGRESS (rawat inap/pet hotel) even if no exam yet.
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

  async function fetchStats() {
    setStatsLoading(true);
    try {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const todayStr = `${yyyy}-${mm}-${dd}`;

      const monthStart = `${yyyy}-${mm}-01`;
      const lastDay = new Date(yyyy, today.getMonth() + 1, 0).getDate();
      const monthEnd = `${yyyy}-${mm}-${String(lastDay).padStart(2, "0")}`;

      const [resToday, resMonth] = await Promise.all([
        fetch(`/api/reports/revenue?start=${todayStr}&end=${todayStr}`, { cache: "no-store" }),
        fetch(`/api/reports/revenue?start=${monthStart}&end=${monthEnd}`, { cache: "no-store" }),
      ]);
      const [dataToday, dataMonth] = await Promise.all([
        resToday.ok ? resToday.json() : [],
        resMonth.ok ? resMonth.json() : [],
      ]);

      const sumToday = Array.isArray(dataToday)
        ? dataToday.reduce((acc: number, it: any) => acc + Number(it?.amount ?? 0), 0)
        : 0;
      const sumMonth = Array.isArray(dataMonth)
        ? dataMonth.reduce((acc: number, it: any) => acc + Number(it?.amount ?? 0), 0)
        : 0;
      setTodaySum(sumToday);
      setTodayCount(Array.isArray(dataToday) ? dataToday.length : 0);
      setMonthSum(sumMonth);
      setMonthCount(Array.isArray(dataMonth) ? dataMonth.length : 0);
    } catch {
      setTodaySum(0);
      setTodayCount(0);
      setMonthSum(0);
      setMonthCount(0);
    } finally {
      setStatsLoading(false);
    }
  }

  React.useEffect(() => {
    void fetchRows();
  }, []);

  React.useEffect(() => {
    void fetchStats();
  }, []);

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pembayaran</h1>
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/settings">
            <Settings className="mr-2 h-4 w-4" /> Pengaturan Invoice
          </Link>
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">
        Daftar tagihan dari booking yang sudah ada tindakan, tetapi belum dibayar.
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Lunas Hari ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {todaySum.toLocaleString("id-ID")}</div>
            <div className="text-muted-foreground text-xs">
              {statsLoading ? "Memuat..." : `${todayCount} transaksi`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Lunas Bulan ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {monthSum.toLocaleString("id-ID")}</div>
            <div className="text-muted-foreground text-xs">
              {statsLoading ? "Memuat..." : `${monthCount} transaksi`}
            </div>
          </CardContent>
        </Card>
      </div>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void fetchRows();
                      void fetchStats();
                    }}
                    disabled={loading || statsLoading}
                  >
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
