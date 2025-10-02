"use client";

import * as React from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ProductUsage = { productName: string; quantity: string | number; unitPrice?: string | number };
type MixUsage = {
  mixProductId: number;
  mixProduct?: { name?: string; price?: string | number } | null;
  quantity: string | number;
  unitPrice?: string | number;
};
type Visit = {
  id: number;
  visitDate: string;
  doctor?: { name?: string } | null;
  paravet?: { name?: string } | null;
  weight?: string | number | null;
  temperature?: string | number | null;
  urine?: string | null;
  defecation?: string | null;
  appetite?: string | null;
  condition?: string | null;
  symptoms?: string | null;
  notes?: string | null;
  productUsages?: ProductUsage[];
  mixUsages?: MixUsage[];
};

export function MedicalVisitsTable({ visits }: { visits: Visit[] }) {
  return (
    <Table className="text-[12px]">
      <TableHeader>
        <TableRow>
          <TableHead>Tanggal</TableHead>
          <TableHead>Staf</TableHead>
          <TableHead>Vitals</TableHead>
          <TableHead>Ringkasan</TableHead>
          <TableHead className="text-right">Produk</TableHead>
          <TableHead className="text-right">Mix</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(visits ?? []).map((v) => {
          const prodCount = Array.isArray(v.productUsages) ? v.productUsages.length : 0;
          const mixCount = Array.isArray(v.mixUsages) ? v.mixUsages.length : 0;
          return (
            <TableRow key={v.id}>
              <TableCell>
                <div className="font-medium">{new Date(v.visitDate).toLocaleString()}</div>
              </TableCell>
              <TableCell>
                <div className="text-muted-foreground text-xs">
                  Dokter: {v.doctor?.name ?? "-"}
                  {v.paravet?.name ? ` · Paravet: ${v.paravet?.name}` : ""}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-xs">
                  W: {v.weight ?? "-"} kg · T: {v.temperature ?? "-"} °C
                </div>
                <div className="text-muted-foreground text-[11px]">
                  Ur: {v.urine ?? "-"} · Def: {v.defecation ?? "-"} · App: {v.appetite ?? "-"}
                </div>
              </TableCell>
              <TableCell>
                <div className="line-clamp-2 text-xs">{v.symptoms ?? v.notes ?? v.condition ?? "-"}</div>
              </TableCell>
              <TableCell className="text-right">{prodCount}</TableCell>
              <TableCell className="text-right">{mixCount}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
