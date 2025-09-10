"use client";
/* eslint-disable import/order */

import * as React from "react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ExamForm({ bookingId, bookingPetId }: { bookingId: number; bookingPetId: number }) {
  const router = useRouter();
  const [weight, setWeight] = React.useState("");
  const [temperature, setTemperature] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [products, setProducts] = React.useState<Array<{ productName: string; quantity: string }>>([
    { productName: "", quantity: "" },
  ]);

  function setProduct(index: number, key: "productName" | "quantity", value: string) {
    setProducts((prev) => prev.map((p, i) => (i === index ? { ...p, [key]: value } : p)));
  }
  function addProduct() {
    setProducts((prev) => [...prev, { productName: "", quantity: "" }]);
  }
  function removeProduct(index: number) {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit() {
    const body = {
      weight: weight || undefined,
      temperature: temperature || undefined,
      notes: notes || undefined,
      products: products.filter((p) => p.productName && p.quantity),
    };
    const res = await fetch(`/api/bookings/${bookingId}/pets/${bookingPetId}/examinations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      toast.error("Gagal menyimpan pemeriksaan");
      return;
    }
    toast.success("Pemeriksaan tersimpan");
    setWeight("");
    setTemperature("");
    setNotes("");
    setProducts([{ productName: "", quantity: "" }]);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tambah Pemeriksaan</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan pemeriksaan" />
          </div>
        </div>

        <div className="grid gap-2">
          <div className="text-sm font-medium">Produk yang dipakai</div>
          {products.map((p, i) => (
            <div key={`${p.productName}-${i}`} className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <Input
                placeholder="Nama produk"
                value={p.productName}
                onChange={(e) => setProduct(i, "productName", e.target.value)}
              />
              <Input placeholder="Qty" value={p.quantity} onChange={(e) => setProduct(i, "quantity", e.target.value)} />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => removeProduct(i)} disabled={products.length <= 1}>
                  Hapus
                </Button>
                {i === products.length - 1 && (
                  <Button variant="secondary" onClick={addProduct}>
                    Tambah
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={submit}>Simpan Pemeriksaan</Button>
        </div>
      </CardContent>
    </Card>
  );
}
