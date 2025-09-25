"use client";

import * as React from "react";

import Link from "next/link";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { withIndexColumn } from "@/components/data-table/table-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { productColumns, type ProductRow } from "./columns";

export function ProductTable({ items }: { items: ProductRow[] }) {
  const columns = React.useMemo(() => withIndexColumn(productColumns), []);
  const table = useDataTableInstance({ data: items, columns, getRowId: (r) => r.id.toString() });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Produk</CardTitle>
        <CardDescription>Stok tersedia per item.</CardDescription>
        <CardAction className="flex items-center gap-2">
          <DataTableViewOptions table={table} />
          <Button asChild>
            <Link href="/dashboard/products/restock">Restock / Adjustment</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex size-full flex-col gap-4">
        <div className="overflow-hidden rounded-md border">
          <DataTable table={table} columns={columns} />
        </div>
        <DataTablePagination table={table} />
      </CardContent>
    </Card>
  );
}
