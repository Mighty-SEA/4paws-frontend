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
  const [discountPercent, setDiscountPercent] = React.useState<number | "">("");

  type Estimate = {
    serviceSubtotal?: number;
    totalProducts?: number;
    totalDailyCharges?: number;
    total?: number;
    depositSum?: number;
    amountDue?: number;
  };
  const [estimate, setEstimate] = React.useState<Estimate | null>(null);

  React.useEffect(() => {
    let mounted = true;
    if (!open) return;
    (async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/billing/estimate`, { cache: "no-store" });
        const e = res.ok ? await res.json() : null;
        if (!mounted) return;
        setEstimate(e);
      } catch {
        if (!mounted) return;
        setEstimate(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open, bookingId]);

  async function doCheckout() {
    try {
      setLoading(true);
      const res = await fetch(`/api/bookings/${bookingId}/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          note,
          discountPercent: discountPercent === "" ? undefined : Number(discountPercent),
        }),
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
            <div className="rounded-md border p-3 text-sm">
              <div className="grid grid-cols-2 gap-y-1 md:grid-cols-4">
                <div className="text-muted-foreground">Total</div>
                <div className="md:col-span-3">Rp {Number(estimate?.total ?? 0).toLocaleString("id-ID")}</div>
                <div className="text-muted-foreground">Diskon</div>
                <div className="md:col-span-3">
                  {(() => {
                    const disc = Number(discountPercent || 0);
                    const amt = (Number(estimate?.total ?? 0) * disc) / 100;
                    return `${disc}% (Rp ${amt.toLocaleString("id-ID")})`;
                  })()}
                </div>
                <div className="text-muted-foreground">Setelah Diskon</div>
                <div className="md:col-span-3">
                  {(() => {
                    const disc = Number(discountPercent || 0);
                    const amt = (Number(estimate?.total ?? 0) * disc) / 100;
                    const discounted = Math.max(0, Number(estimate?.total ?? 0) - amt);
                    return `Rp ${discounted.toLocaleString("id-ID")}`;
                  })()}
                </div>
                <div className="text-muted-foreground">Deposit</div>
                <div className="md:col-span-3">Rp {Number(estimate?.depositSum ?? 0).toLocaleString("id-ID")}</div>
                <div className="text-muted-foreground">Sisa Tagihan</div>
                <div className="font-semibold md:col-span-3">
                  {(() => {
                    const disc = Number(discountPercent || 0);
                    const amt = (Number(estimate?.total ?? 0) * disc) / 100;
                    const discounted = Math.max(0, Number(estimate?.total ?? 0) - amt);
                    const due = Math.max(0, discounted - Number(estimate?.depositSum ?? 0));
                    return `Rp ${due.toLocaleString("id-ID")}`;
                  })()}
                </div>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Metode Pembayaran</Label>
              <Input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="Tunai/QR/Transfer" />
            </div>
            <div>
              <Label className="mb-2 block">Diskon (%)</Label>
              <Input
                inputMode="numeric"
                value={discountPercent}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") return setDiscountPercent("");
                  const n = Math.max(0, Math.min(100, Number(v.replace(/[^0-9.]/g, ""))));
                  setDiscountPercent(Number.isFinite(n) ? n : "");
                }}
                placeholder="Opsional"
              />
            </div>
            <div>
              <Label className="mb-2 block">Catatan</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" />
            </div>
            <div className="flex justify-end">
              <Button onClick={doCheckout} disabled={loading}>
                {(() => {
                  if (loading) return "Memproses...";
                  const disc = Number(discountPercent || 0);
                  const amt = (Number(estimate?.total ?? 0) * disc) / 100;
                  const discounted = Math.max(0, Number(estimate?.total ?? 0) - amt);
                  const due = Math.max(0, discounted - Number(estimate?.depositSum ?? 0));
                  const text = label ?? "Bayar";
                  return due ? `${text} Rp ${due.toLocaleString("id-ID")}` : text;
                })()}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
