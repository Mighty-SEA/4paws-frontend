"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Product = { id: number; name: string; unit: string; unitContentAmount?: string; unitContentName?: string };

export function ProductForms({ products }: { products: Product[] }) {
  const router = useRouter();
  const [productName, setProductName] = React.useState("");
  const [unit, setUnit] = React.useState("");
  const [unitContentAmount, setUnitContentAmount] = React.useState("");
  const [unitContentName, setUnitContentName] = React.useState("");
  const [price, setPrice] = React.useState("");

  async function addProduct() {
    if (!productName || !unit) {
      toast.error("Isi nama produk dan unit");
      return;
    }
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: productName,
        unit,
        price: price || undefined,
        unitContentAmount: unitContentAmount || undefined,
        unitContentName: unitContentName || undefined,
      }),
    });
    if (!res.ok) return toast.error("Gagal menambah produk");
    toast.success("Produk ditambahkan");
    setProductName("");
    setUnit("");
    setPrice("");
    setUnitContentAmount("");
    setUnitContentName("");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tambah Produk</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div>
          <Label className="mb-2 block">Nama Produk</Label>
          <Input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Contoh: Amoxicillin"
          />
        </div>
        <div>
          <Label className="mb-2 block">Unit (utama)</Label>
          <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Contoh: botol, kaplet" />
        </div>
        <div>
          <Label className="mb-2 block">Harga per unit</Label>
          <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Contoh: 15000" />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <Label className="mb-2 block">Isi per unit (opsional)</Label>
            <Input
              value={unitContentAmount}
              onChange={(e) => setUnitContentAmount(e.target.value)}
              placeholder="Contoh: 100"
            />
          </div>
          <div>
            <Label className="mb-2 block">Nama isi (opsional)</Label>
            <Input
              value={unitContentName}
              onChange={(e) => setUnitContentName(e.target.value)}
              placeholder="Contoh: ml, tablet"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={addProduct}>Tambah</Button>
        </div>
      </CardContent>
    </Card>
  );
}
