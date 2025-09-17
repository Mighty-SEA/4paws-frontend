"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ExamProducts({
  products,
  productsList,
  setProduct,
  addProduct,
  removeProduct,
}: {
  products: Array<{ id: string; productName: string; quantity: string }>;
  productsList: Array<{ id: number; name: string }>;
  setProduct: (index: number, key: "productName" | "quantity", value: string) => void;
  addProduct: () => void;
  removeProduct: (index: number) => void;
}) {
  return (
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
  );
}
