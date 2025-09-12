"use client";

/* eslint-disable complexity */

import * as React from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Product = { id: number; name: string; unit?: string; unitContentAmount?: string; unitContentName?: string };

export function MixForms({ products }: { products: Product[] }) {
  const [mixName, setMixName] = React.useState("");
  const [mixDesc, setMixDesc] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [components, setComponents] = React.useState<Array<{ id: string; productId: string; quantityBase: string }>>([
    { id: Math.random().toString(36).slice(2), productId: "", quantityBase: "" },
  ]);

  function setComponent(index: number, key: "productId" | "quantityBase", value: string) {
    setComponents((prev) => prev.map((c, i) => (i === index ? { ...c, [key]: value } : c)));
  }
  function addComponent() {
    setComponents((prev) => [...prev, { id: Math.random().toString(36).slice(2), productId: "", quantityBase: "" }]);
  }
  function removeComponent(index: number) {
    setComponents((prev) => prev.filter((_, i) => i !== index));
  }
  async function addMix() {
    if (!mixName || !components.filter((c) => c.productId && c.quantityBase).length) {
      toast.error("Isi nama mix dan minimal 1 komponen");
      return;
    }
    for (const c of components) {
      const p = products.find((x) => String(x.id) === c.productId);
      if (!p?.unitContentAmount || Number(p.unitContentAmount) <= 0) {
        toast.error(`Produk '${p?.name ?? "?"}' tidak memiliki isi per unit. Tidak dapat dipakai untuk Mix.`);
        return;
      }
    }
    const res = await fetch("/api/mix-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: mixName,
        description: mixDesc || undefined,
        price: price || undefined,
        components: components
          .filter((c) => c.productId && c.quantityBase)
          .map((c) => ({ productId: Number(c.productId), quantityBase: c.quantityBase })),
      }),
    });
    if (!res.ok) return toast.error("Gagal membuat mix");
    toast.success("Mix dibuat");
    setMixName("");
    setMixDesc("");
    setPrice("");
    setComponents([{ id: Math.random().toString(36).slice(2), productId: "", quantityBase: "" }]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buat Mix (Racikan)</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div>
          <Label className="mb-2 block">Nama Mix</Label>
          <Input value={mixName} onChange={(e) => setMixName(e.target.value)} placeholder="Contoh: Mix Flu" />
        </div>
        <div>
          <Label className="mb-2 block">Deskripsi (opsional)</Label>
          <Input value={mixDesc} onChange={(e) => setMixDesc(e.target.value)} placeholder="Keterangan" />
        </div>
        <div>
          <Label className="mb-2 block">Harga Mix</Label>
          <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Contoh: 20000" />
        </div>
        <div className="grid gap-2">
          <div className="text-sm font-medium">Komponen</div>
          {components.map((c, i) => {
            const prod = products.find((p) => String(p.id) === c.productId);
            const innerLabel = prod?.unitContentName;
            const outerUnit = prod?.unit ?? "unit";
            const perText = prod?.unitContentAmount
              ? `1 ${outerUnit} = ${prod.unitContentAmount} ${prod.unitContentName ?? "isi"}`
              : undefined;
            return (
              <div key={c.id} className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <select
                  className="rounded-md border px-3 py-2"
                  value={c.productId}
                  onChange={(e) => setComponent(i, "productId", e.target.value)}
                >
                  <option value="">Pilih Produk</option>
                  {products
                    .filter((p) => p.unitContentAmount && Number(p.unitContentAmount) > 0)
                    .map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.name}
                      </option>
                    ))}
                </select>
                <div className="relative">
                  <Input
                    className="pr-16"
                    placeholder={`Qty (dalam ${innerLabel ?? "isi per unit"})`}
                    value={c.quantityBase}
                    onChange={(e) => setComponent(i, "quantityBase", e.target.value)}
                  />
                  {innerLabel && (
                    <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs">
                      {innerLabel}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => removeComponent(i)} disabled={components.length <= 1}>
                    Hapus
                  </Button>
                  {i === components.length - 1 && (
                    <Button variant="secondary" onClick={addComponent}>
                      Tambah
                    </Button>
                  )}
                </div>
                {perText ? (
                  <div className="text-muted-foreground col-span-full text-[11px]">{perText}</div>
                ) : (
                  <div className="col-span-full text-[11px] text-yellow-600">
                    Produk ini belum memiliki isi per unit
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-end">
          <Button onClick={addMix}>Buat Mix</Button>
        </div>
      </CardContent>
    </Card>
  );
}
