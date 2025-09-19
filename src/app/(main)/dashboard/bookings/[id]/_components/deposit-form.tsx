"use client";

/* eslint-disable import/order */

import * as React from "react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DepositForm({
  bookingId,
  initial,
}: {
  bookingId: number;
  initial?: {
    id?: number | string;
    amount?: number | string;
    method?: string;
    estimatedTotal?: number | string;
    startDate?: string;
    endDate?: string;
  };
}) {
  const router = useRouter();
  const [amount, setAmount] = React.useState("");
  const [method, setMethod] = React.useState("");
  const [estimatedTotal, setEstimatedTotal] = React.useState("");
  const [startDate, setStartDate] = React.useState(() => {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`; // default: hari ini (lokal)
  });
  const [endDate, setEndDate] = React.useState("");

  React.useEffect(() => {
    if (!initial) return;
    if (initial.amount !== undefined) setAmount(String(initial.amount ?? ""));
    if (initial.method !== undefined) setMethod(initial.method ?? "");
    if (initial.estimatedTotal !== undefined) setEstimatedTotal(String(initial.estimatedTotal ?? ""));
    if (initial.startDate !== undefined) setStartDate(initial.startDate ?? "");
    if (initial.endDate !== undefined) setEndDate(initial.endDate ?? "");
  }, [initial]);

  async function submit() {
    if (!amount) {
      toast.error("Isi nominal deposit");
      return;
    }
    // If editing (initial exists), call PUT to update the existing first deposit
    const payload: any = {
      amount,
      method: method || undefined,
      estimatedTotal: estimatedTotal || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
    if (initial) payload.id = initial.id ?? undefined;
    const res = await fetch(`/api/bookings/${bookingId}/deposits`, {
      method: initial ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
            <Label className="mb-2 block">Check-in</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block">Check-out</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={submit}>Simpan Deposit</Button>
        </div>
      </CardContent>
    </Card>
  );
}
