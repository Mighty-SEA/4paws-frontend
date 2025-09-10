"use client";
/* eslint-disable import/order */
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function VisitForm({ bookingId, bookingPetId }: { bookingId: number; bookingPetId: number }) {
  const router = useRouter();
  const [visitDate, setVisitDate] = React.useState("");
  const [weight, setWeight] = React.useState("");
  const [temperature, setTemperature] = React.useState("");
  const [notes, setNotes] = React.useState("");

  async function submit() {
    const body = {
      visitDate: visitDate || undefined,
      weight: weight || undefined,
      temperature: temperature || undefined,
      notes: notes || undefined,
    };
    const res = await fetch(`/api/bookings/${bookingId}/pets/${bookingPetId}/visits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      toast.error("Gagal menyimpan visit");
      return;
    }
    toast.success("Visit tersimpan");
    setVisitDate("");
    setWeight("");
    setTemperature("");
    setNotes("");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tambah Visit</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <Label className="mb-2 block">Tanggal Visit (opsional)</Label>
            <Input type="datetime-local" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block">Berat (kg)</Label>
            <Input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="5.2" />
          </div>
          <div>
            <Label className="mb-2 block">Suhu (°C)</Label>
            <Input value={temperature} onChange={(e) => setTemperature(e.target.value)} placeholder="38.5" />
          </div>
          <div>
            <Label className="mb-2 block">Catatan</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan visit" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={submit}>Simpan Visit</Button>
        </div>
      </CardContent>
    </Card>
  );
}
