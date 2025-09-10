"use client";

/* eslint-disable import/order */

import * as React from "react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DepositForm({ bookingId }: { bookingId: number }) {
  const router = useRouter();
  const [amount, setAmount] = React.useState("");
  const [method, setMethod] = React.useState("");

  async function submit() {
    if (!amount) {
      toast.error("Isi nominal deposit");
      return;
    }
    const res = await fetch(`/api/bookings/${bookingId}/deposits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, method: method || undefined }),
    });
    if (!res.ok) {
      const msg = await res.json().catch(() => ({}));
      toast.error(msg?.message ?? "Gagal menyimpan deposit");
      return;
    }
    toast.success("Deposit tersimpan");
    setAmount("");
    setMethod("");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposit / Check-in</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
          <div className="flex items-end">
            <Button onClick={submit}>Simpan Deposit</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
