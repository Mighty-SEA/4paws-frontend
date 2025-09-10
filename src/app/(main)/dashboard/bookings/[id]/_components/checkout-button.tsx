"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function CheckoutButton({ bookingId }: { bookingId: number }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  async function doCheckout() {
    try {
      setLoading(true);
      const res = await fetch(`/api/bookings/${bookingId}/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) return;
      router.refresh();
    } finally {
      setLoading(false);
    }
  }
  return (
    <Button onClick={doCheckout} disabled={loading}>
      {loading ? "Memproses..." : "Checkout"}
    </Button>
  );
}
