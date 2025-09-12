"use client";
/* eslint-disable import/order */
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DailyCharge = {
  id: number;
  chargeDate: string | null;
  amount: string;
  description?: string | null;
};

export function DailyChargesTab({ bookingId, bookingPetId }: { bookingId: number; bookingPetId: number }) {
  const router = useRouter();
  const [amount, setAmount] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<DailyCharge[]>([]);

  const load = React.useCallback(async () => {
    const res = await fetch(`/api/bookings/${bookingId}/pets/${bookingPetId}/daily-charges`, { cache: "no-store" });
    const data = (await res.json().catch(() => [])) as DailyCharge[];
    setItems(Array.isArray(data) ? data : []);
  }, [bookingId, bookingPetId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function addCharge() {
    if (!amount) return;
    setLoading(true);
    const res = await fetch(`/api/bookings/${bookingId}/pets/${bookingPetId}/daily-charges`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, description: description ?? undefined }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Gagal menyimpan biaya harian");
      return;
    }
    toast.success("Biaya harian tersimpan");
    setAmount("");
    setDescription("");
    await load();
    router.refresh();
  }

  async function generateToday() {
    setLoading(true);
    const res = await fetch(`/api/bookings/${bookingId}/pets/${bookingPetId}/daily-charges`, {
      method: "PUT",
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Gagal generate biaya harian hari ini");
      return;
    }
    toast.success("Biaya harian hari ini dibuat");
    await load();
    router.refresh();
  }

  return (
    <div className="grid gap-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Biaya Harian</CardTitle>
          <Button variant="secondary" onClick={generateToday} disabled={loading}>
            Generate biaya harian hari ini
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <Label className="mb-2 block">Nominal</Label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50000" />
            </div>
            <div>
              <Label className="mb-2 block">Deskripsi (opsional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Rawat inap harian"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addCharge} disabled={loading || !amount}>
                Tambah Biaya Harian
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Biaya Harian</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {items.length ? (
            items.map((c) => (
              <div key={c.id} className="rounded-md border p-2 text-xs">
                <div>{c.chargeDate ? new Date(c.chargeDate).toLocaleString() : "-"}</div>
                <div>Nominal: {c.amount}</div>
                <div>Deskripsi: {c.description ?? "-"}</div>
              </div>
            ))
          ) : (
            <div className="text-muted-foreground text-sm">Belum ada biaya harian</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
