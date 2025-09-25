import { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { createSmartFilterFn } from "@/components/data-table/table-utils";
import { Button } from "@/components/ui/button";

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
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    filterFn: createSmartFilterFn<OwnerRow>(),
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    filterFn: createSmartFilterFn<OwnerRow>(),
    cell: ({ row }) => <span className="truncate">{row.original.email ?? "-"}</span>,
  },
  {
    accessorKey: "phone",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Phone" />,
    filterFn: createSmartFilterFn<OwnerRow>(),
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
      <div className="flex items-center justify-end gap-2 pr-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => document.dispatchEvent(new CustomEvent("owner:view", { detail: row.original }))}
        >
          View
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => document.dispatchEvent(new CustomEvent("owner:edit", { detail: row.original }))}
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => document.dispatchEvent(new CustomEvent("owner:delete", { detail: row.original }))}
        >
          Hapus
        </Button>
      </div>
    ),
    enableSorting: false,
  },
];
