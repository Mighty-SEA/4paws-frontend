"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";
import * as XLSX from "xlsx";

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
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

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
      } catch {
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
    } catch {
      void 0;
    }
    router.refresh();
  }

  function downloadTemplate() {
    const data = products.map((p) => ({
      productId: p.id,
      name: p.name,
      unit: p.unit,
      qty: "",
      type: allType,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Restock");
    XLSX.writeFile(wb, "restock_template.xlsx");
  }

  function normalizeHeader(header: string) {
    return header.trim().toLowerCase().replace(/\s+/g, "");
  }

  function getNumber(value: unknown): number | null {
    if (value == null) return null;
    const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, "."));
    return Number.isFinite(n) ? n : null;
  }

  type NormalizedRow = Record<string, unknown>;

  function createProductIndexMaps(ps: Product[]) {
    const idToIndex = new Map<number, number>();
    const nameToIndex = new Map<string, number>();
    ps.forEach((p, idx) => {
      idToIndex.set(p.id, idx);
      nameToIndex.set(p.name.trim().toLowerCase(), idx);
    });
    return { idToIndex, nameToIndex };
  }

  function normalizeRowKeys(row: Record<string, unknown>): NormalizedRow {
    return Object.keys(row).reduce<Record<string, unknown>>((acc, key) => {
      const normalized = normalizeHeader(key);
      // eslint-disable-next-line security/detect-object-injection
      acc[normalized] = row[key];
      return acc;
    }, {});
  }

  function resolveTargetIndex(
    row: NormalizedRow,
    maps: { idToIndex: Map<number, number>; nameToIndex: Map<string, number> },
  ) {
    const idCandidates = ["productid", "id"] as const;
    for (const k of idCandidates) {
      // eslint-disable-next-line security/detect-object-injection
      const id = getNumber(row[k]);
      if (id != null) {
        const idx = maps.idToIndex.get(id);
        if (typeof idx === "number") return idx;
      }
    }
    const nameCandidates = ["name", "productname", "namaproduk"] as const;
    for (const k of nameCandidates) {
      // eslint-disable-next-line security/detect-object-injection
      const v = row[k];
      if (typeof v === "string" && v.trim()) {
        const idx = maps.nameToIndex.get(v.trim().toLowerCase());
        if (typeof idx === "number") return idx;
      }
    }
    return null;
  }

  function resolveQuantity(row: NormalizedRow) {
    const qtyCandidates = ["qty", "quantity", "jumlah"] as const;
    for (const k of qtyCandidates) {
      // eslint-disable-next-line security/detect-object-injection
      const n = getNumber(row[k]);
      if (n != null) return n;
    }
    return null;
  }

  function aggregateQuantities(rawRows: Array<Record<string, unknown>>, ps: Product[]) {
    const maps = createProductIndexMaps(ps);
    const qtyByIndex = new Map<number, number>();
    for (const r of rawRows) {
      const norm = normalizeRowKeys(r);
      const idx = resolveTargetIndex(norm, maps);
      if (idx == null) continue;
      const qty = resolveQuantity(norm);
      if (qty == null) continue;
      const prev = qtyByIndex.get(idx) ?? 0;
      qtyByIndex.set(idx, prev + qty);
    }
    return qtyByIndex;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

      if (!Array.isArray(raw) || raw.length === 0) {
        toast.error("File kosong atau tidak valid");
        return;
      }
      const qtyByIndex = aggregateQuantities(raw, products);
      if (qtyByIndex.size === 0) {
        toast.error("Tidak ada baris cocok dengan produk");
        return;
      }

      setRows((prev) =>
        prev.map((r, i) => {
          if (!qtyByIndex.has(i)) return r;
          const total = qtyByIndex.get(i)!;
          return { ...r, qty: String(total) };
        }),
      );

      toast.success("Berhasil impor dari Excel");
    } catch {
      toast.error("Gagal membaca file Excel");
    } finally {
      // reset input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-xs">Anda bisa mengunduh template, isi qty lalu impor.</div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
          <Button variant="outline" onClick={downloadTemplate}>
            Unduh Template
          </Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            Impor Excel
          </Button>
        </div>
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
