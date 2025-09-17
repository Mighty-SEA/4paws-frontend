"use client";

/* eslint-disable import/order */

import * as React from "react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DepositForm({ bookingId, initial }: { bookingId: number; initial?: { amount?: number | string; method?: string; estimatedTotal?: number | string; estimatedEndDate?: string } }) {
  const router = useRouter();
  const [amount, setAmount] = React.useState("");
  const [method, setMethod] = React.useState("");
  const [estimatedTotal, setEstimatedTotal] = React.useState("");
  const [estimatedEndDate, setEstimatedEndDate] = React.useState("");

  React.useEffect(() => {
    if (!initial) return;
    if (initial.amount !== undefined) setAmount(String(initial.amount ?? ""));
    if (initial.method !== undefined) setMethod(initial.method ?? "");
    if (initial.estimatedTotal !== undefined) setEstimatedTotal(String(initial.estimatedTotal ?? ""));
    if (initial.estimatedEndDate !== undefined) setEstimatedEndDate(initial.estimatedEndDate ?? "");
  }, [initial]);

  async function submit() {
    if (!amount) {
      toast.error("Isi nominal deposit");
      return;
    }
    const res = await fetch(`/api/bookings/${bookingId}/deposits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        method: method || undefined,
        estimatedTotal: estimatedTotal || undefined,
        estimatedEndDate: estimatedEndDate || undefined,
      }),
    });
    if (!res.ok) {
      const msg = await res.json().catch(() => ({}));
      toast.error(msg?.message ?? "Gagal menyimpan deposit");
      return;
    }
    toast.success("Deposit tersimpan");
    router.push(`/dashboard/bookings/${bookingId}/visit`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposit / Check-in</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <Label className="mb-2 block">Nominal</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500000"
            />
          </div>
          <div>
            <Label className="mb-2 block">Metode (opsional)</Label>
            <Input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="Cash/Transfer" />
          </div>
          <div>
            <Label className="mb-2 block">Estimasi Biaya (opsional)</Label>
            <Input value={estimatedTotal} onChange={(e) => setEstimatedTotal(e.target.value)} placeholder="1000000" />
          </div>
          <div>
            <Label className="mb-2 block">Estimasi Selesai (opsional)</Label>
            <Input
              type="datetime-local"
              value={estimatedEndDate}
              onChange={(e) => setEstimatedEndDate(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={submit}>Simpan Deposit</Button>
        </div>
      </CardContent>
    </Card>
  );
}
