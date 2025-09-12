"use client";
/* eslint-disable import/order */

import * as React from "react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ExamForm({
  bookingId,
  bookingPetId,
  mode,
}: {
  bookingId: number;
  bookingPetId: number;
  mode?: "perDay" | "default";
}) {
  const router = useRouter();
  const [weight, setWeight] = React.useState("");
  const [temperature, setTemperature] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [products, setProducts] = React.useState<Array<{ id: string; productName: string; quantity: string }>>([
    { id: Math.random().toString(36).slice(2), productName: "", quantity: "" },
  ]);
  const [productsList, setProductsList] = React.useState<Array<{ id: number; name: string }>>([]);
  const [mixList, setMixList] = React.useState<Array<{ id: number; name: string }>>([]);
  const [mixItems, setMixItems] = React.useState<Array<{ id: string; mixProductId: string; quantity: string }>>([
    { id: Math.random().toString(36).slice(2), mixProductId: "", quantity: "" },
  ]);

  React.useEffect(() => {
    (async () => {
      const res = await fetch("/api/mix-products", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMixList(Array.isArray(data) ? data.map((m: any) => ({ id: m.id, name: m.name })) : []);
      }
      const resProd = await fetch("/api/products", { cache: "no-store" });
      if (resProd.ok) {
        const data = await resProd.json();
        setProductsList(Array.isArray(data) ? data.map((p: any) => ({ id: p.id, name: p.name })) : []);
      }
    })();
  }, []);

  function setProduct(index: number, key: "productName" | "quantity", value: string) {
    setProducts((prev) => prev.map((p, i) => (i === index ? { ...p, [key]: value } : p)));
  }
  function addProduct() {
    setProducts((prev) => [...prev, { id: Math.random().toString(36).slice(2), productName: "", quantity: "" }]);
  }
  function removeProduct(index: number) {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  }

  function setMixItem(index: number, key: "mixProductId" | "quantity", value: string) {
    setMixItems((prev) => prev.map((m, i) => (i === index ? { ...m, [key]: value } : m)));
  }
  function addMixItem() {
    setMixItems((prev) => [...prev, { id: Math.random().toString(36).slice(2), mixProductId: "", quantity: "" }]);
  }
  function removeMixItem(index: number) {
    setMixItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit() {
    const body = {
      weight: weight || undefined,
      temperature: temperature || undefined,
      notes: notes || undefined,
      products: products
        .filter((p) => p.productName && p.quantity)
        .map((p) => ({ productName: p.productName, quantity: p.quantity })),
    };
    const res = await fetch(`/api/bookings/${bookingId}/pets/${bookingPetId}/examinations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      toast.error("Gagal menyimpan pemeriksaan");
      return false;
    }
    // Use mixes (multiple)
    const mixesToUse = mixItems.filter((m) => m.mixProductId && m.quantity);
    if (mixesToUse.length) {
      await Promise.all(
        mixesToUse.map((m) =>
          fetch(`/api/bookings/${bookingId}/pets/${bookingPetId}/mix-usage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mixProductId: Number(m.mixProductId), quantity: m.quantity }),
          }),
        ),
      );
    }
    toast.success("Pemeriksaan tersimpan");
    setWeight("");
    setTemperature("");
    setNotes("");
    setProducts([{ id: Math.random().toString(36).slice(2), productName: "", quantity: "" }]);
    setMixItems([{ id: Math.random().toString(36).slice(2), mixProductId: "", quantity: "" }]);
    router.refresh();
    return true;
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
            <div key={p.id} className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <select
                className="rounded-md border px-3 py-2"
                value={p.productName}
                onChange={(e) => setProduct(i, "productName", e.target.value)}
              >
                <option value="">Pilih Produk</option>
                {productsList.map((prd) => (
                  <option key={prd.id} value={prd.name}>
                    {prd.name}
                  </option>
                ))}
              </select>
              <div className="relative">
                <Input
                  className="pr-20"
                  placeholder="Qty (dalam unit utama)"
                  value={p.quantity}
                  onChange={(e) => setProduct(i, "quantity", e.target.value)}
                />
                <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs">
                  unit
                </span>
              </div>
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

        <div className="grid gap-2">
          <div className="text-sm font-medium">Mix (Racikan)</div>
          {mixItems.map((m, i) => (
            <div key={m.id} className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <select
                className="rounded-md border px-3 py-2"
                value={m.mixProductId}
                onChange={(e) => setMixItem(i, "mixProductId", e.target.value)}
              >
                <option value="">Pilih Mix</option>
                {mixList.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
              <Input placeholder="Qty" value={m.quantity} onChange={(e) => setMixItem(i, "quantity", e.target.value)} />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => removeMixItem(i)} disabled={mixItems.length <= 1}>
                  Hapus
                </Button>
                {i === mixItems.length - 1 && (
                  <Button variant="secondary" onClick={addMixItem}>
                    Tambah
                  </Button>
                )}
              </div>
            </div>
          ))}
          <div className="text-muted-foreground text-xs">Opsional: mix akan di-expand ke produk</div>
        </div>

        {mode === "perDay" ? (
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
                const ok = await submit();
                if (ok) router.push(`/dashboard/bookings/${bookingId}`);
              }}
            >
              Lanjutkan ke Deposit
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                const ok = await submit();
                if (ok) router.push(`/dashboard/bookings`);
              }}
            >
              Selesai
            </Button>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button onClick={submit}>Simpan Pemeriksaan</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
