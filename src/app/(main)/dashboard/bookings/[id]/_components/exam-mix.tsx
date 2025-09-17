"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ExamMix({
  mixItems,
  mixList,
  setMixItem,
  addMixItem,
  removeMixItem,
}: {
  mixItems: Array<{ id: string; mixProductId: string; quantity: string }>;
  mixList: Array<{ id: number; name: string }>;
  setMixItem: (index: number, key: "mixProductId" | "quantity", value: string) => void;
  addMixItem: () => void;
  removeMixItem: (index: number) => void;
}) {
  return (
    <div className="grid gap-2">
      <div className="text-sm font-medium">Mix (Racikan)</div>
      {mixItems.map((m, i) => (
        <div key={m.id} className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <select
            className="rounded-md border px-3 py-2"
            value={m.mixProductId}
            onChange={(e) => setMixItem(i, "mixProductId", e.target.value)}
          >
            <option value="">Pilih Mix</option>
            {mixList.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
          <Input placeholder="Qty" value={m.quantity} onChange={(e) => setMixItem(i, "quantity", e.target.value)} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => removeMixItem(i)} disabled={mixItems.length <= 1}>
              Hapus
            </Button>
            {i === mixItems.length - 1 && (
              <Button variant="secondary" onClick={addMixItem}>
                Tambah
              </Button>
            )}
          </div>
        </div>
      ))}
      <div className="text-muted-foreground text-xs">Opsional: mix akan di-expand ke produk</div>
    </div>
  );
}
