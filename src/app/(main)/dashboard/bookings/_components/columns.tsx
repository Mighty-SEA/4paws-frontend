import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";

export type BookingRow = {
  id: number;
  ownerName: string;
  serviceName: string;
  serviceTypeName: string;
  status: string;
  createdAt: string;
};

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
    cell: ({ row }) => <span>{row.original.status}</span>,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button asChild size="sm" variant="outline">
        <Link href={`/dashboard/bookings/${row.original.id}`}>View</Link>
      </Button>
    ),
  },
];

