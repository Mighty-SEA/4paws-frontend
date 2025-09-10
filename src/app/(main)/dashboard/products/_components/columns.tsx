import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

export type ProductRow = {
  id: number;
  name: string;
  unit: string;
  content: string;
  available: number;
};

export const productColumns: ColumnDef<ProductRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "unit",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Unit" />,
    cell: ({ row }) => <span>{row.original.unit}</span>,
  },
  {
    accessorKey: "content",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Content/Unit" />,
    cell: ({ row }) => <span>{row.original.content || "-"}</span>,
  },
  {
    accessorKey: "available",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Available" />,
    cell: ({ row }) => <span className="tabular-nums">{row.original.available}</span>,
  },
];
