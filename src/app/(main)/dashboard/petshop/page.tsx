"use client";

import * as React from "react";

import Link from "next/link";

import * as XLSX from "xlsx";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { createSmartFilterFn, withIndexColumn } from "@/components/data-table/table-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

type PetshopRow = {
  id: string;
  bookingId: number;
  date: string;
  ownerName: string;
  status: string;
  items: string;
  total: number;
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

function extractProductsFromBooking(booking: Record<string, unknown>): string[] {
  const products: string[] = [];
  const pets = Array.isArray(booking?.pets) ? booking.pets : [];

  pets.forEach((bp: unknown) => {
    const pet = bp as Record<string, unknown>;

    // From examinations
    const examinations = Array.isArray(pet?.examinations) ? pet.examinations : [];
    examinations.forEach((exam: unknown) => {
      const e = exam as Record<string, unknown>;
      const productUsages = Array.isArray(e?.productUsages) ? e.productUsages : [];
      productUsages.forEach((pu: unknown) => {
        const usage = pu as Record<string, unknown>;
        if (usage?.productName) {
          products.push(`${usage.productName} (${usage.quantity ?? 0})`);
        }
      });
    });

    // From visits
    const visits = Array.isArray(pet?.visits) ? pet.visits : [];
    visits.forEach((visit: unknown) => {
      const v = visit as Record<string, unknown>;

      // Product usages from visits
      const productUsages = Array.isArray(v?.productUsages) ? v.productUsages : [];
      productUsages.forEach((pu: unknown) => {
        const usage = pu as Record<string, unknown>;
        if (usage?.productName) {
          products.push(`${usage.productName} (${usage.quantity ?? 0})`);
        }
      });

      // Mix usages from visits
      const mixUsages = Array.isArray(v?.mixUsages) ? v.mixUsages : [];
      mixUsages.forEach((mu: unknown) => {
        const mix = mu as Record<string, unknown>;
        const mixProduct = mix?.mixProduct as Record<string, unknown>;
        if (mixProduct?.name) {
          products.push(`${mixProduct.name} (${mix.quantity ?? 0})`);
        }
      });
    });

    // From standalone mix usages
    const mixUsages = Array.isArray(pet?.mixUsages) ? pet.mixUsages : [];
    mixUsages.forEach((mu: unknown) => {
      const mix = mu as Record<string, unknown>;
      const mixProduct = mix?.mixProduct as Record<string, unknown>;
      if (mixProduct?.name) {
        products.push(`${mixProduct.name} (${mix.quantity ?? 0})`);
      }
    });
  });

  return products;
}

export default function PetshopPage() {
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

  const [start, setStart] = useQueryParamState("ps_start", startDefault);
  const [end, setEnd] = useQueryParamState("ps_end", endDefault);

  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<PetshopRow[]>([]);

  const columns = React.useMemo(
    () =>
      withIndexColumn<PetshopRow>([
        {
          accessorKey: "bookingId",
          header: ({ column }) => <DataTableColumnHeader column={column} title="No. Pemesanan" />,
          cell: ({ row }) => (
            <Link href={`/dashboard/bookings/${row.original.bookingId}`} className="text-blue-600 hover:underline">
              #{row.original.bookingId}
            </Link>
          ),
        },
        {
          accessorKey: "date",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
          cell: ({ row }) => <span className="tabular-nums">{row.original.date}</span>,
        },
        {
          accessorKey: "ownerName",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
          filterFn: createSmartFilterFn<PetshopRow>(),
        },
        {
          accessorKey: "status",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
          cell: ({ row }) => {
            const status = row.original.status;
            const variant =
              status === "COMPLETED"
                ? "default"
                : status === "IN_PROGRESS"
                  ? "secondary"
                  : status === "PENDING"
                    ? "outline"
                    : "destructive";
            return <Badge variant={variant}>{status}</Badge>;
          },
          filterFn: createSmartFilterFn<PetshopRow>(),
        },
        {
          accessorKey: "items",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Items" />,
          cell: ({ row }) => {
            const items = row.original.items;
            const maxLen = 80;
            const short = items.length > maxLen ? `${items.slice(0, maxLen)}...` : items;
            return (
              <span title={items} className="inline-block max-w-[40ch] truncate align-top lg:max-w-[60ch]">
                {short}
              </span>
            );
          },
        },
        {
          accessorKey: "total",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
          cell: ({ row }) => (
            <span className="font-medium tabular-nums">Rp {row.original.total.toLocaleString("id-ID")}</span>
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

      // Fetch bookings and filter for petshop services
      const res = await fetch(`/api/bookings?${qs.toString()}`, { cache: "no-store" });
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];

      // Filter for petshop bookings only
      const petshopBookings = items.filter((booking: unknown) => {
        const b = booking as Record<string, unknown>;
        const serviceType = b?.serviceType as Record<string, unknown>;
        const service = serviceType?.service as Record<string, unknown>;
        const serviceName = String(service?.name ?? "").toLowerCase();
        const typeName = String(serviceType?.name ?? "").toLowerCase();
        return serviceName.includes("petshop") || typeName.includes("petshop");
      });

      // Fetch billing estimates for all petshop bookings
      const bookingEstimates = await Promise.all(
        petshopBookings.map(async (booking: unknown) => {
          const b = booking as Record<string, unknown>;
          try {
            const estimateRes = await fetch(`/api/bookings/${b.id}/billing/estimate`, { cache: "no-store" });
            const estimate = estimateRes.ok ? await estimateRes.json() : null;
            return { bookingId: b.id, estimate };
          } catch {
            return { bookingId: b.id, estimate: null };
          }
        }),
      );

      const estimateMap = new Map(bookingEstimates.map((e) => [e.bookingId, e.estimate]));

      const mapped: PetshopRow[] = petshopBookings.map((booking: unknown, idx: number) => {
        const b = booking as Record<string, unknown>;
        const products = extractProductsFromBooking(b);

        // Get total from billing estimate
        const estimate = estimateMap.get(b.id);
        const total = Number(estimate?.total ?? 0);

        const owner = b?.owner as Record<string, unknown>;
        return {
          id: String(idx),
          bookingId: Number(b.id),
          date: b.createdAt ? new Date(b.createdAt as string).toLocaleDateString("id-ID") : "",
          ownerName: String(owner?.name ?? ""),
          status: String(b?.status ?? "PENDING"),
          items: products.length > 0 ? products.join(", ") : "Belum ada produk",
          total,
        };
      });

      setRows(mapped);
    } catch (error) {
      console.error("Error fetching petshop data:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  const handleExportExcel = React.useCallback(() => {
    const headers = ["No. Pemesanan", "Tanggal", "Customer", "Status", "Items", "Total"] as const;

    const exportRows = rows.map((r) => ({
      "No. Pemesanan": `#${r.bookingId}`,
      Tanggal: r.date,
      Customer: r.ownerName,
      Status: r.status,
      Items: r.items,
      Total: r.total,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows, { header: [...headers] as string[] });

    // Auto-fit column widths
    const colWidths = headers.map((h) => {
      const maxLen = exportRows.reduce((m, row) => {
        const raw = (row as Record<string, unknown>)[h];
        const str = raw == null ? "" : String(raw);
        return Math.max(m, str.length);
      }, h.length);
      return { wch: Math.min(60, Math.max(8, maxLen + 2)) };
    });
    (worksheet as Record<string, unknown>)["!cols"] = colWidths;

    // Add AutoFilter
    const range = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: exportRows.length, c: headers.length - 1 } });
    (worksheet as Record<string, unknown>)["!autofilter"] = { ref: range };

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Petshop");
    const filename = `petshop-orders_${start}_to_${end}.xlsx`;
    XLSX.writeFile(workbook, filename);
  }, [rows, start, end]);

  React.useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid gap-4" suppressHydrationWarning>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Petshop Orders</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportExcel} disabled={!rows.length}>
            Export Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div className="grid gap-1">
              <Label htmlFor="ps-start">Mulai</Label>
              <Input id="ps-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="ps-end">Selesai</Label>
              <Input id="ps-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={() => void fetchData()} disabled={loading} className="w-full">
                {loading ? "Memuat..." : "Search"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStart(startDefault);
                  setEnd(endDefault);
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="min-w-0 rounded-md border">
        <div className="flex items-center justify-between p-2">
          <DataTableViewOptions table={table} />
          <div className="text-muted-foreground text-xs">Menampilkan data pemesanan petshop</div>
        </div>
        <DataTable table={table} columns={columns} />
        <div className="p-2">
          <DataTablePagination table={table} />
        </div>
      </div>
    </div>
  );
}
