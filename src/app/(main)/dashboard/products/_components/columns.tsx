import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { createSmartFilterFn } from "@/components/data-table/table-utils";

export type ProductRow = {
  id: number;
  name: string;
  unit: string;
  content: string;
  available: number;
  price?: number;
};

export const productColumns: ColumnDef<ProductRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    filterFn: createSmartFilterFn<ProductRow>(),
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "unit",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Unit" />,
    filterFn: createSmartFilterFn<ProductRow>(),
    cell: ({ row }) => <span>{row.original.unit}</span>,
  },
  {
    accessorKey: "content",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Content/Unit" />,
    filterFn: createSmartFilterFn<ProductRow>(),
    cell: ({ row }) => <span>{row.original.content || "-"}</span>,
  },
  {
    accessorKey: "available",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Available" />,
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.available} {row.original.unit}
      </span>
    ),
  },
  {
    accessorKey: "price",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Harga" />,
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.price != null
          ? `Rp ${Number(Number(row.original.price) * Number(row.original.available ?? 0)).toLocaleString("id-ID")}`
          : "-"}
      </span>
    ),
  },
];
