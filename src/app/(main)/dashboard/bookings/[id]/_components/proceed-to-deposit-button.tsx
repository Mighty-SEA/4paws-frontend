"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function ProceedToDepositButton({ bookingId }: { bookingId: number }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function proceed() {
    try {
      setLoading(true);
      await fetch(`/api/bookings/${bookingId}/plan-admission`, { method: "PATCH" });
      router.push(`/dashboard/bookings/${bookingId}/deposit`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" onClick={proceed} disabled={loading}>
      {loading ? "Memproses..." : "Lanjutkan ke Deposit"}
    </Button>
  );
}
