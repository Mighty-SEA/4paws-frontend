"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";
import * as XLSX from "xlsx";

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
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const [importRows, setImportRows] = React.useState<Array<Record<string, unknown>>>([]);
  const [isImporting, setIsImporting] = React.useState(false);

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

  function handleChooseFile() {
    fileRef.current?.click();
  }

  function downloadTemplate() {
    try {
      const headers = ["name", "unit", "price", "unit_content_amount", "unit_content_name"];
      const example = ["Amoxicillin", "botol", "15000", "100", "ml"];
      const ws = XLSX.utils.aoa_to_sheet([headers, example]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Products");
      XLSX.writeFile(wb, "template-produk.xlsx");
    } catch (e) {
      console.error(e);
      toast.error("Gagal membuat template");
    }
  }

  function normalizeHeader(h: string) {
    return String(h || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (!json.length) {
        toast.error("File kosong");
        return;
      }
      const [headerRow, ...rows] = json;
      const headers = headerRow.map((h) => normalizeHeader(String(h ?? "")));
      const mapped = rows
        .filter((r) => (r ?? []).some((c) => String(c ?? "").trim().length > 0))
        .map((r) => {
          const obj: Record<string, unknown> = {};
          headers.forEach((h, idx) => {
            obj[h] = r[idx];
          });
          return obj;
        });
      setImportRows(mapped);
      toast.success(`Berhasil membaca ${mapped.length} baris`);
    } catch (err) {
      console.error(err);
      toast.error("Gagal membaca file");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function importNow() {
    if (!importRows.length) {
      toast.error("Tidak ada data untuk diimport");
      return;
    }
    setIsImporting(true);
    let okCount = 0;
    for (const row of importRows) {
      const name = String(row["name"] ?? row["nama"] ?? row["nama_produk"] ?? "").trim();
      const unitVal = String(row["unit"] ?? row["satuan"] ?? "").trim();
      const priceVal = String(row["price"] ?? row["harga"] ?? "").trim();
      const contentAmt = String(row["unit_content_amount"] ?? row["isi_per_unit"] ?? row["isi"] ?? "").trim();
      const contentName = String(row["unit_content_name"] ?? row["nama_isi"] ?? row["isi_nama"] ?? "").trim();
      if (!name || !unitVal) continue;
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          unit: unitVal,
          price: priceVal || undefined,
          unitContentAmount: contentAmt || undefined,
          unitContentName: contentName || undefined,
        }),
      }).catch(() => null);
      if (res && res.ok) okCount += 1;
    }
    toast.success(`Import selesai. Berhasil: ${okCount}/${importRows.length}`);
    setImportRows([]);
    setIsImporting(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tambah Produk</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {/* Import via Excel/CSV */}
        <div className="flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
          <Button variant="outline" onClick={downloadTemplate}>
            Unduh Template
          </Button>
          <Button variant="secondary" onClick={handleChooseFile} disabled={isImporting}>
            Pilih File Excel/CSV
          </Button>
          <Button onClick={importNow} disabled={isImporting || importRows.length === 0}>
            Import {importRows.length ? `(${importRows.length})` : ""}
          </Button>
        </div>
        {importRows.length > 0 ? (
          <div className="text-muted-foreground text-xs">
            Kolom didukung: name/nama, unit/satuan, price/harga, unit_content_amount/isi_per_unit/isi,
            unit_content_name/nama_isi/isi_nama
          </div>
        ) : null}
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
