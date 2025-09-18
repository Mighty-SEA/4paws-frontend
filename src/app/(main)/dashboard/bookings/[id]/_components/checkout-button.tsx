"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CheckoutButton({ bookingId, label }: { bookingId: number; label?: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [method, setMethod] = React.useState("Tunai");
  const [note, setNote] = React.useState("");

  async function doCheckout() {
    try {
      setLoading(true);
      const res = await fetch(`/api/bookings/${bookingId}/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, note }),
      });
      if (!res.ok) return;
      router.refresh();
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }
  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={loading}>
        {loading ? "Memproses..." : (label ?? "Checkout")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="mb-2 block">Metode Pembayaran</Label>
              <Input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="Tunai/QR/Transfer" />
            </div>
            <div>
              <Label className="mb-2 block">Catatan</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" />
            </div>
            <div className="flex justify-end">
              <Button onClick={doCheckout} disabled={loading}>
                {loading ? "Memproses..." : "Bayar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
