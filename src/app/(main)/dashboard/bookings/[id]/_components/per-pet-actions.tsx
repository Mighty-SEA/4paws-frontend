"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function PerPetActions({ bookingId, petId }: { bookingId: number; petId: number }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState<"splitDeposit" | "splitFinish" | null>(null);

  async function splitThen(action: "deposit" | "finish") {
    try {
      setLoading(action === "deposit" ? "splitDeposit" : "splitFinish");
      // Split single pet into a new booking
      const res = await fetch(`/api/bookings/${bookingId}/split`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ petIds: [petId] }),
      });
      if (!res.ok) return;
      const newBooking = await res.json().catch(() => null);
      if (!newBooking?.id) {
        router.refresh();
        return;
      }
      if (action === "deposit") {
        await fetch(`/api/bookings/${newBooking.id}`, { method: "PATCH" });
        router.push(`/dashboard/bookings/${newBooking.id}/deposit`);
      } else {
        await fetch(`/api/bookings/${newBooking.id}/billing/checkout`, { method: "POST" });
        router.push(`/dashboard/bookings`);
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="secondary" onClick={() => splitThen("deposit")} disabled={loading !== null}>
        {loading === "splitDeposit" ? "Memproses..." : "Pisahkan & Deposit"}
      </Button>
      <Button size="sm" variant="outline" onClick={() => splitThen("finish")} disabled={loading !== null}>
        {loading === "splitFinish" ? "Memproses..." : "Pisahkan & Selesai"}
      </Button>
    </div>
  );
}
