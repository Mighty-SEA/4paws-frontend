"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Product = { id: number; name: string; unit: string };

export function RestockForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const [rows, setRows] = React.useState<Array<{ productId: number; qty: string }>>(
    products.map((p) => ({ productId: p.id, qty: "" })),
  );
  const [allType, setAllType] = React.useState<"IN" | "ADJUSTMENT">("IN");
  const [savingDraft, setSavingDraft] = React.useState(false);
  const [lastSavedAt, setLastSavedAt] = React.useState<string | null>(null);
  const scope = "restock";

  function setRow(index: number, key: "qty", value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, qty: value } : r)));
  }

  // Load draft from server on mount
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/drafts?scope=${scope}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.data) {
          const draft = data.data as {
            rows?: Array<{ productId: number; qty: string }>;
            allType?: "IN" | "ADJUSTMENT";
          };
          if (Array.isArray(draft.rows)) setRows(draft.rows);
          if (draft.allType === "IN" || draft.allType === "ADJUSTMENT") setAllType(draft.allType);
          if (data.updatedAt) setLastSavedAt(new Date(data.updatedAt).toLocaleString());
          toast.message("Draft dimuat", { description: lastSavedAt ? `Terakhir: ${lastSavedAt}` : undefined });
        }
      } catch (_err) {
        void 0;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveDraft() {
    try {
      setSavingDraft(true);
      const payload = { scope, data: { rows, allType } };
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        toast.error("Gagal menyimpan draft");
        return;
      }
      const data = await res.json().catch(() => ({}));
      const ts = data?.updatedAt ?? new Date().toISOString();
      setLastSavedAt(new Date(ts).toLocaleString());
      toast.success("Draft tersimpan");
      router.push("/dashboard/products");
    } finally {
      setSavingDraft(false);
    }
  }

  async function submitAll() {
    const payload = rows.filter((r) => r.qty && Number(r.qty) !== 0);
    if (!payload.length) {
      toast.error("Isi minimal satu quantity");
      return;
    }
    const results = await Promise.all(
      payload.map((r) =>
        fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: r.productId, quantity: r.qty, type: allType }),
        }),
      ),
    );
    if (results.some((res) => !res.ok)) {
      toast.error("Sebagian gagal disimpan");
    } else {
      toast.success("Stok diperbarui");
    }
    // Bersihkan draft setelah submit sukses
    try {
      await fetch(`/api/drafts?scope=${scope}`, { method: "DELETE" });
    } catch (_err) {
      void 0;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Jenis untuk semua produk</div>
        <Select value={allType} onValueChange={(v) => setAllType(v as "IN" | "ADJUSTMENT")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Pilih jenis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="IN">IN</SelectItem>
            <SelectItem value="ADJUSTMENT">ADJUSTMENT</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* eslint-disable security/detect-object-injection */}
      {products.map((p, i) => (
        <div key={p.id} className="grid grid-cols-1 items-center gap-2 md:grid-cols-4">
          <div className="text-sm font-medium">{p.name}</div>
          <Input
            placeholder={`Qty (${p.unit})`}
            value={rows[i]?.qty ?? ""}
            onChange={(e) => setRow(i, "qty", e.target.value)}
          />
          <div className="text-muted-foreground text-xs">Jenis: {allType}</div>
          <div className="text-muted-foreground text-xs">Satuan: {p.unit}</div>
        </div>
      ))}
      {/* eslint-enable security/detect-object-injection */}
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-xs">
          {lastSavedAt ? `Draft terakhir: ${lastSavedAt}` : "Belum ada draft"}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={saveDraft} disabled={savingDraft}>
            {savingDraft ? "Menyimpan..." : "Simpan Draft"}
          </Button>
          <Button onClick={submitAll}>Simpan</Button>
        </div>
      </div>
    </div>
  );
}
