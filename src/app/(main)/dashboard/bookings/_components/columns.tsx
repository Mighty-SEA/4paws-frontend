/* eslint-disable import/order */
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import type { ColumnDef } from "@tanstack/react-table";
import { createSmartFilterFn } from "@/components/data-table/table-utils";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export type BookingRow = {
  id: number;
  ownerName: string;
  petNames?: string;
  serviceName: string;
  serviceTypeName: string;
  status: string;
  createdAt: string;
  createdDate?: string;
  createdTime?: string;
  isPerDay?: boolean;
  hasExam?: boolean;
  hasDeposit?: boolean;
  proceedToAdmission?: boolean;
  groomerNames?: string;
  firstPetId?: number;
  petCount?: number;
};

function NextAction({ row }: { row: BookingRow }) {
  // For per-day bookings (Pet Hotel/Rawat Inap): when PENDING and belum proceed, show Periksa Pra Ranap
  if (row.isPerDay && row.status === "PENDING" && !row.proceedToAdmission) {
    return (
      <Button asChild size="sm" variant="secondary">
        <Link href={`/dashboard/bookings/${row.id}/examination`}>Periksa Pra Ranap</Link>
      </Button>
    );
  }
  // For non per-day: show default Tindakan if not completed and no exam yet
  if (!row.isPerDay && row.status !== "COMPLETED" && !row.hasExam) {
    return (
      <Button asChild size="sm" variant="secondary">
        <Link href={`/dashboard/bookings/${row.id}/examination`}>Tindakan</Link>
      </Button>
    );
  }
  return null;
}

function MoreActions({ row }: { row: BookingRow }) {
  async function deleteBooking() {
    if (!confirm("Hapus booking ini?")) return;
    const res = await fetch(`/api/bookings/${row.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Gagal menghapus booking");
      return;
    }
    toast.success("Booking dihapus");
    // Soft refresh via client navigation
    window.location.reload();
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/bookings/${row.id}`}>Lihat Detail</Link>
        </DropdownMenuItem>
        {row.isPerDay ? (
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/bookings/${row.id}/visit/history`}>Riwayat Visit</Link>
          </DropdownMenuItem>
        ) : null}
        {row.firstPetId ? (
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/pets/${row.firstPetId}`}>Rekam Medis</Link>
          </DropdownMenuItem>
        ) : null}
        {row.isPerDay && (row.status === "IN_PROGRESS" || row.status === "WAITING_TO_DEPOSIT") ? (
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/bookings/${row.id}/deposit`}>Deposit</Link>
          </DropdownMenuItem>
        ) : null}
        {row.hasExam ? (
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/bookings/${row.id}/examination/edit`}>Edit Tindakan</Link>
          </DropdownMenuItem>
        ) : null}
        {row.status === "PENDING" ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={deleteBooking}>Hapus Booking</DropdownMenuItem>
          </>
        ) : null}
        {null}
        {row.status === "COMPLETED" ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/bookings/${row.id}/invoice`}>Unduh Invoice</Link>
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/bookings/${row.id}`}>Pisahkan Booking</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const bookingColumns: ColumnDef<BookingRow>[] = [
  {
    accessorKey: "createdDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal Booking" />,
    cell: ({ row }) => {
      return row.original.createdDate ?? "-";
    },
  },
  {
    accessorKey: "createdTime",
    id: "bookingTime",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Jam Booking" />,
    cell: ({ row }) => {
      return row.original.createdTime ?? "-";
    },
  },
  {
    accessorKey: "ownerName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Owner" />,
    filterFn: createSmartFilterFn<BookingRow>(),
    cell: ({ row }) => <span className="font-medium">{row.original.ownerName}</span>,
  },
  {
    accessorKey: "petNames",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pets" />,
    filterFn: createSmartFilterFn<BookingRow>(),
    cell: ({ row }) => <span>{row.original.petNames ?? "-"}</span>,
  },
  {
    accessorKey: "serviceName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Service" />,
    filterFn: createSmartFilterFn<BookingRow>(),
    cell: ({ row }) => <span>{row.original.serviceName}</span>,
  },
  {
    accessorKey: "serviceTypeName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    filterFn: createSmartFilterFn<BookingRow>(),
    cell: ({ row }) => <span>{row.original.serviceTypeName}</span>,
  },
  // Groomer column removed per request
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    filterFn: createSmartFilterFn<BookingRow>(),
    cell: ({ row }) => <Badge variant="secondary">{row.original.status}</Badge>,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/dashboard/bookings/${row.original.id}`}>View</Link>
        </Button>
        {row.original.isPerDay ? (
          row.original.status === "IN_PROGRESS" ? (
            <Button asChild size="sm" variant="secondary">
              <Link href={`/dashboard/bookings/${row.original.id}/visit/form`}>Visit</Link>
            </Button>
          ) : row.original.status === "WAITING_TO_DEPOSIT" ? (
            <Button asChild size="sm" variant="secondary">
              <Link href={`/dashboard/bookings/${row.original.id}/deposit`}>Deposit</Link>
            </Button>
          ) : null
        ) : null}
        <NextAction row={row.original} />
        {!row.original.isPerDay && row.original.hasExam && row.original.status !== "COMPLETED" ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/bookings/${row.original.id}`}>Bayar / Invoice</Link>
          </Button>
        ) : null}
        <MoreActions row={row.original} />
      </div>
    ),
  },
];
