import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { createSmartFilterFn } from "@/components/data-table/table-utils";

export type ServiceRow = {
  id: number;
  name: string;
};

export const serviceColumns: ColumnDef<ServiceRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    filterFn: createSmartFilterFn<ServiceRow>(),
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
];
