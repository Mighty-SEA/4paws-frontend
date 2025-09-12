import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

export type InventoryRow = {
  id: number;
  createdAt: string;
  productName: string;
  unit: string;
  type: string;
  quantity: number;
  note?: string;
};

export const inventoryColumns: ColumnDef<InventoryRow>[] = [
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
  },
  {
    accessorKey: "productName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Produk" />,
    cell: ({ row }) => <span className="font-medium">{row.original.productName}</span>,
  },
  {
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tipe" />,
    cell: ({ row }) => row.original.type,
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Qty" />,
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.quantity} {row.original.unit}
      </span>
    ),
  },
  {
    accessorKey: "note",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Catatan" />,
    cell: ({ row }) => row.original.note ?? "-",
  },
];
