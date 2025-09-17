"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type Pet = { id: number; name?: string };

export function SplitBooking({ bookingId, pets }: { bookingId: number; pets: Pet[] }) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<number[]>([]);
  const [loading, setLoading] = React.useState(false);

  function toggle(id: number, checked: boolean) {
    setSelected((prev) => (checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)));
  }

  async function doSplit() {
    if (selected.length === 0) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/bookings/${bookingId}/split`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ petIds: selected }),
      });
      if (!res.ok) return;
      setSelected([]);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="text-sm font-medium">Pilih hewan untuk dipisah ke booking baru:</div>
      <div className="grid gap-1">
        {pets.map((p) => (
          <label key={p.id} className="flex items-center gap-2 text-sm">
            <Checkbox checked={selected.includes(p.id)} onCheckedChange={(v) => toggle(p.id, Boolean(v))} />
            <span>{p.name ?? `Pet #${p.id}`}</span>
          </label>
        ))}
      </div>
      <div>
        <Button size="sm" variant="secondary" onClick={doSplit} disabled={loading || selected.length === 0}>
          {loading ? "Memproses..." : "Pisahkan Booking"}
        </Button>
      </div>
    </div>
  );
}
