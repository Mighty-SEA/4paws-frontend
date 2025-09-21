import Link from "next/link";

import { ColumnDef } from "@tanstack/react-table";
import { EllipsisVertical } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export type OwnerRow = {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address: string;
  _count?: { pets: number };
};

export const ownerColumns: ColumnDef<OwnerRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => <span className="truncate">{row.original.email ?? "-"}</span>,
  },
  {
    accessorKey: "phone",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Phone" />,
    cell: ({ row }) => <span className="tabular-nums">{row.original.phone}</span>,
  },
  {
    id: "pets",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pets" />,
    // eslint-disable-next-line no-underscore-dangle
    cell: ({ row }) => <span>{row.original._count?.pets ?? 0}</span>,
    enableSorting: false,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/owners/${row.original.id}`}>View</Link>
        </Button>
        {/* Edit/Delete actions will be implemented in the table container using role from session */}
      </div>
    ),
    enableSorting: false,
  },
];
