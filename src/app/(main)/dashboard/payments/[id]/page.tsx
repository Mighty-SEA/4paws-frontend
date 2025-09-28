"use client";

import * as React from "react";

import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Estimate = {
  serviceSubtotal?: number;
  totalProducts?: number;
  total?: number;
  depositSum?: number;
  amountDue?: number;
};

export default function PaymentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const bookingId = Number(params?.id);

  const [loading, setLoading] = React.useState(false);
  const [method, setMethod] = React.useState("");
  const [note, setNote] = React.useState("");
  const [discountPercent, setDiscountPercent] = React.useState<number | "">("");

  const [booking, setBooking] = React.useState<any>(null);
  const [estimate, setEstimate] = React.useState<Estimate | null>(null);
  const [deposits, setDeposits] = React.useState<any[]>([]);
  const [payments, setPayments] = React.useState<any[]>([]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [bRes, eRes, dRes, pRes] = await Promise.all([
          fetch(`/api/bookings/${bookingId}`, { cache: "no-store" }),
          fetch(`/api/bookings/${bookingId}/billing/estimate`, { cache: "no-store" }),
          fetch(`/api/bookings/${bookingId}/deposits`, { cache: "no-store" }),
          fetch(`/api/bookings/${bookingId}/payments`, { cache: "no-store" }),
        ]);
        const [b, e, d, p] = await Promise.all([
          bRes.ok ? bRes.json() : null,
          eRes.ok ? eRes.json() : null,
          dRes.ok ? dRes.json() : [],
          pRes.ok ? pRes.json() : [],
        ]);
        if (!mounted) return;
        setBooking(b);
        setEstimate(e);
        setDeposits(Array.isArray(d) ? d : []);
        setPayments(Array.isArray(p) ? p : []);
      } catch {
        if (!mounted) return;
        setBooking(null);
        setEstimate(null);
        setDeposits([]);
        setPayments([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [bookingId]);

  async function handlePay() {
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
      router.push(`/dashboard/bookings/${bookingId}/invoice`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pembayaran Booking #{bookingId}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Ringkasan Booking</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="grid grid-cols-2 gap-y-1 md:grid-cols-4">
              <div className="text-muted-foreground">Owner</div>
              <div className="md:col-span-3">{booking?.owner?.name ?? "-"}</div>
              <div className="text-muted-foreground">Layanan</div>
              <div className="md:col-span-3">{booking?.serviceType?.service?.name ?? "-"}</div>
              <div className="text-muted-foreground">Tipe</div>
              <div className="md:col-span-3">{booking?.serviceType?.name ?? "-"}</div>
              <div className="text-muted-foreground">Status</div>
              <div className="md:col-span-3">{booking?.status ?? "-"}</div>
            </div>
            {Array.isArray(booking?.items) && booking.items.filter((it: any) => it.role === "ADDON").length > 0 ? (
              <div className="rounded-md border p-3">
                <div className="mb-2 text-sm font-medium">Addon</div>
                <div className="grid gap-1 text-sm">
                  {booking.items
                    .filter((it: any) => it.role === "ADDON")
                    .map((it: any) => (
                      <div key={it.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{it.serviceType?.name ?? "-"}</div>
                          <div className="text-muted-foreground text-xs">{it.serviceType?.service?.name ?? "-"}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : null}
            <div className="mt-3 rounded-md border">
              <div className="grid grid-cols-2 gap-y-1 p-3 text-sm md:grid-cols-4">
                <div className="text-muted-foreground">Subtotal Layanan</div>
                <div className="md:col-span-3">Rp {(estimate?.serviceSubtotal ?? 0).toLocaleString("id-ID")}</div>
                <div className="text-muted-foreground">Products</div>
                <div className="md:col-span-3">Rp {(estimate?.totalProducts ?? 0).toLocaleString("id-ID")}</div>
                <div className="text-muted-foreground">Deposit</div>
                <div className="md:col-span-3">Rp {(estimate?.depositSum ?? 0).toLocaleString("id-ID")}</div>
                <div className="text-muted-foreground">Diskon (%)</div>
                <div className="md:col-span-3">
                  <div className="grid grid-cols-2 gap-2">
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
                    <div className="self-center text-right">
                      {(() => {
                        const disc = Number(discountPercent || 0);
                        const amt = ((estimate?.total ?? 0) * disc) / 100;
                        return `Rp ${amt.toLocaleString("id-ID")}`;
                      })()}
                    </div>
                  </div>
                </div>
                <div className="text-muted-foreground">Total</div>
                <div className="md:col-span-3">Rp {(estimate?.total ?? 0).toLocaleString("id-ID")}</div>
                <div className="text-muted-foreground">Setelah Diskon</div>
                <div className="md:col-span-3">
                  {(() => {
                    const disc = Number(discountPercent || 0);
                    const discountAmount = ((estimate?.total ?? 0) * disc) / 100;
                    const discountedTotal = Math.max(0, (estimate?.total ?? 0) - discountAmount);
                    return `Rp ${discountedTotal.toLocaleString("id-ID")}`;
                  })()}
                </div>
                <div className="text-muted-foreground">Sisa Tagihan</div>
                <div className="font-semibold md:col-span-3">
                  {(() => {
                    const disc = Number(discountPercent || 0);
                    const discountAmount = ((estimate?.total ?? 0) * disc) / 100;
                    const discountedTotal = Math.max(0, (estimate?.total ?? 0) - discountAmount);
                    const due = Math.max(0, discountedTotal - (estimate?.depositSum ?? 0));
                    return `Rp ${due.toLocaleString("id-ID")}`;
                  })()}
                </div>
              </div>
            </div>

            {Array.isArray(deposits) && deposits.length ? (
              <div>
                <div className="mb-2 text-sm font-medium">Riwayat Deposit</div>
                <div className="grid gap-2">
                  {deposits.map((d) => (
                    <div key={d.id} className="rounded-md border p-2 text-xs">
                      <div>{new Date(d.depositDate).toLocaleString()}</div>
                      <div>Jumlah: Rp {Number(d.amount ?? 0).toLocaleString("id-ID")}</div>
                      <div>Metode: {d.method ?? "-"}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {Array.isArray(payments) && payments.length ? (
              <div>
                <div className="mb-2 text-sm font-medium">Pembayaran Sebelumnya</div>
                <div className="grid gap-2">
                  {payments.map((p) => (
                    <div key={p.id} className="rounded-md border p-2 text-xs">
                      <div>{new Date(p.createdAt).toLocaleString()}</div>
                      <div>Amount: Rp {Number(p.amount ?? 0).toLocaleString("id-ID")}</div>
                      <div>Metode: {p.method ?? "-"}</div>
                      <div>Invoice: {p.invoiceNo ?? "-"}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Form Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div>
              <Label className="mb-2 block">Metode Pembayaran</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih metode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                  <SelectItem value="QRIS">QRIS</SelectItem>
                  <SelectItem value="DEBIT">Debit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Catatan</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" />
            </div>
            <div className="flex justify-end">
              <Button onClick={handlePay} disabled={loading}>
                {loading ? "Memproses..." : "Bayar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
