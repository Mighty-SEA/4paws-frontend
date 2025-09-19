/* eslint-disable import/order */
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import type { ColumnDef } from "@tanstack/react-table";
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

export type BookingRow = {
  id: number;
  ownerName: string;
  serviceName: string;
  serviceTypeName: string;
  status: string;
  createdAt: string;
  isPerDay?: boolean;
  hasExam?: boolean;
  hasDeposit?: boolean;
  proceedToAdmission?: boolean;
};

function NextAction({ row }: { row: BookingRow }) {
  if (row.isPerDay) {
    if (!row.hasExam) {
      return (
        <Button asChild size="sm" variant="secondary">
          <Link href={`/dashboard/bookings/${row.id}/examination`}>Periksa Pra Ranap</Link>
        </Button>
      );
    }
    if (row.proceedToAdmission && row.status === "WAITING_TO_DEPOSIT" && !row.hasDeposit) {
      return (
        <Button asChild size="sm" variant="secondary">
          <Link href={`/dashboard/bookings/${row.id}/deposit`}>Deposit</Link>
        </Button>
      );
    }
    if (row.hasDeposit) {
      return (
        <Button asChild size="sm" variant="secondary">
          <Link href={`/dashboard/bookings/${row.id}/visit`}>Visit</Link>
        </Button>
      );
    }
  } else {
    if (row.status !== "COMPLETED" && !row.hasExam) {
      return (
        <Button asChild size="sm" variant="secondary">
          <Link href={`/dashboard/bookings/${row.id}/examination`}>Tindakan</Link>
        </Button>
      );
    }
  }
  return null;
}

function MoreActions({ row }: { row: BookingRow }) {
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
            <Link href={`/dashboard/bookings/${row.id}/examination/edit`}>Edit Periksa Pra Ranap</Link>
          </DropdownMenuItem>
        ) : row.hasExam ? (
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/bookings/${row.id}/examination/edit`}>Edit Tindakan</Link>
          </DropdownMenuItem>
        ) : null}
        {row.isPerDay ? (
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/bookings/${row.id}/deposit/edit`}>Edit Deposit</Link>
          </DropdownMenuItem>
        ) : null}
        {row.isPerDay ? (
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/bookings/${row.id}/visit`}>Edit Visit</Link>
          </DropdownMenuItem>
        ) : null}
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
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
  },
  {
    accessorKey: "ownerName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Owner" />,
    cell: ({ row }) => <span className="font-medium">{row.original.ownerName}</span>,
  },
  {
    accessorKey: "serviceName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Service" />,
    cell: ({ row }) => <span>{row.original.serviceName}</span>,
  },
  {
    accessorKey: "serviceTypeName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => <span>{row.original.serviceTypeName}</span>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <Badge variant="secondary">{row.original.status}</Badge>,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/dashboard/bookings/${row.original.id}`}>View</Link>
        </Button>
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
