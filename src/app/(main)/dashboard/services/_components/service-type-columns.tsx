import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

export type ServiceTypeRow = {
  id: number;
  name: string;
  serviceId: number;
  serviceName?: string;
  price?: string | null;
  pricePerDay?: string | null;
};

export const serviceTypeColumns: ColumnDef<ServiceTypeRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "serviceName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Service" />,
    cell: ({ row }) => <span>{row.original.serviceName}</span>,
  },
  {
    accessorKey: "price",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
    cell: ({ row }) => <span>{row.original.price ?? "-"}</span>,
  },
  {
    accessorKey: "pricePerDay",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Price/Day" />,
    cell: ({ row }) => <span>{row.original.pricePerDay ?? "-"}</span>,
  },
];
