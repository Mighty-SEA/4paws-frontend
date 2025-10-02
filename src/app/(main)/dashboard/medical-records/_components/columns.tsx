/* eslint-disable import/order */
import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";
import { createSmartFilterFn } from "@/components/data-table/table-utils";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";

export type PetRow = {
  id: number;
  name: string;
  ownerName: string;
  species: string;
  breed: string;
  speciesBreed: string;
  lastVisitAt?: string; // ISO string
  lastServiceName?: string;
  lastAnamnesis?: string;
};

export const medicalRecordColumns: ColumnDef<PetRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Hewan" />,
    filterFn: createSmartFilterFn<PetRow>(),
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "ownerName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pemilik" />,
    filterFn: createSmartFilterFn<PetRow>(),
    cell: ({ row }) => <span>{row.original.ownerName}</span>,
  },
  {
    accessorKey: "species",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Jenis" />,
    filterFn: createSmartFilterFn<PetRow>(),
    cell: ({ row }) => <span className="truncate">{row.original.species}</span>,
  },
  {
    accessorKey: "lastServiceName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Service Terakhir" />,
    filterFn: createSmartFilterFn<PetRow>(),
    cell: ({ row }) => <span className="truncate">{row.original.lastServiceName ?? "-"}</span>,
  },
  {
    accessorKey: "lastAnamnesis",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Anamnesis Terakhir" />,
    filterFn: createSmartFilterFn<PetRow>(),
    cell: ({ row }) => (
      <span className="text-muted-foreground line-clamp-1 max-w-[280px]">{row.original.lastAnamnesis ?? "-"}</span>
    ),
  },
  {
    id: "lastVisitAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kunjungan Terakhir" />,
    cell: ({ row }) => {
      const ts = row.original.lastVisitAt;
      return ts ? new Date(ts).toLocaleString() : "-";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-2 p-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/dashboard/medical-records/${row.original.id}`}>View</Link>
        </Button>
      </div>
    ),
  },
];
