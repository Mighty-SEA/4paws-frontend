"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function DepositsList({ bookingId, items }: { bookingId: number; items: any[] }) {
  const router = useRouter();
  async function remove(id: number | string) {
    const ok = window.confirm("Hapus deposit ini?");
    if (!ok) return;
    const res = await fetch(`/api/bookings/${bookingId}/deposits?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      // optional: toast error, keep it simple
      return;
    }
    router.refresh();
  }
  if (!Array.isArray(items) || !items.length) {
    return <div className="text-muted-foreground text-xs">Belum ada deposit</div>;
  }
  return (
    <div className="grid gap-2 text-sm">
      {items.map((d: any) => (
        <div key={d.id} className="flex items-center justify-between rounded-md border p-2 text-xs">
          <div>
            <div>{new Date(d.depositDate).toLocaleString()}</div>
            <div className="text-muted-foreground">Metode: {d.method ?? "-"}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="tabular-nums">Rp {Number(d.amount ?? 0).toLocaleString("id-ID")}</div>
            <Button size="sm" variant="outline" onClick={() => remove(d.id)}>Hapus</Button>
          </div>
        </div>
      ))}
    </div>
  );
}


