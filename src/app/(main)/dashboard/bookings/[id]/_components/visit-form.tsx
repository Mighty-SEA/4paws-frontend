"use client";
/* eslint-disable import/order */
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function VisitForm({
  bookingId,
  bookingPetId,
  ownerName,
  petName,
  minDate,
  maxDate,
}: {
  bookingId: number;
  bookingPetId: number;
  ownerName?: string;
  petName?: string;
  minDate?: string;
  maxDate?: string;
}) {
  const router = useRouter();
  const [visitDate, setVisitDate] = React.useState("");
  const [weight, setWeight] = React.useState("");
  const [temperature, setTemperature] = React.useState("");
  const [notes, setNotes] = React.useState("");
  // Satwagia-like extras
  const [doctorId, setDoctorId] = React.useState("");
  const [doctors, setDoctors] = React.useState<Array<{ id: number; name: string }>>([]);
  const [paravetId, setParavetId] = React.useState("");
  const [paravets, setParavets] = React.useState<Array<{ id: number; name: string }>>([]);
  const [urine, setUrine] = React.useState("");
  const [defecation, setDefecation] = React.useState("");
  const [appetite, setAppetite] = React.useState("");
  const [condition, setCondition] = React.useState("");
  const [symptoms, setSymptoms] = React.useState("");
  const [productsList, setProductsList] = React.useState<
    Array<{ id: number; name: string; unit?: string; unitContentAmount?: string; unitContentName?: string }>
  >([]);
  const [mixList, setMixList] = React.useState<
    Array<{ id: number; name: string; components?: Array<{ productId: number; quantityBase: string }> }>
  >([]);
  const [products, setProducts] = React.useState<
    Array<{ id: string; productId: string; productName: string; quantity: string }>
  >([{ id: Math.random().toString(36).slice(2), productId: "", productName: "", quantity: "" }]);
  const [mixItems, setMixItems] = React.useState<Array<{ id: string; mixProductId: string; quantity: string }>>([
    { id: Math.random().toString(36).slice(2), mixProductId: "", quantity: "" },
  ]);
  const [quickMix, setQuickMix] = React.useState<{
    name: string;
    components: Array<{ id: string; productId: string; quantity: string }>;
  }>({
    name: "",
    components: [{ id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
  });

  React.useEffect(() => {
    (async () => {
      const resProd = await fetch("/api/products", { cache: "no-store" });
      if (resProd.ok) {
        const data = await resProd.json();
        setProductsList(
          Array.isArray(data)
            ? data.map((p: any) => ({
                id: p.id,
                name: p.name,
                unit: p.unit,
                unitContentAmount: p.unitContentAmount,
                unitContentName: p.unitContentName,
              }))
            : [],
        );
      }
      const resMix = await fetch("/api/mix-products", { cache: "no-store" });
      if (resMix.ok) {
        const data = await resMix.json();
        setMixList(
          Array.isArray(data)
            ? data.map((m: any) => ({
                id: m.id,
                name: m.name,
                components: m.components?.map((c: any) => ({ productId: c.productId, quantityBase: c.quantityBase })),
              }))
            : [],
        );
      }
      const resStaff = await fetch("/api/staff", { cache: "no-store" });
      if (resStaff.ok) {
        const data = await resStaff.json();
        setDoctors(
          Array.isArray(data)
            ? data.filter((s: any) => s.jobRole === "DOCTOR").map((s: any) => ({ id: s.id, name: s.name }))
            : [],
        );
        setParavets(
          Array.isArray(data)
            ? data.filter((s: any) => s.jobRole === "PARAVET").map((s: any) => ({ id: s.id, name: s.name }))
            : [],
        );
      }
    })();
  }, []);

  function setProduct(index: number, key: "productId" | "productName" | "quantity", value: string) {
    setProducts((prev) => prev.map((p, i) => (i === index ? { ...p, [key]: value } : p)));
  }
  function addProduct() {
    setProducts((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), productId: "", productName: "", quantity: "" },
    ]);
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
  function setQuickMixComponent(index: number, key: "productId" | "quantity", value: string) {
    setQuickMix((prev) => ({
      ...prev,
      components: prev.components.map((c, i) => (i === index ? { ...c, [key]: value } : c)),
    }));
  }
  function addQuickMixComponent() {
    setQuickMix((prev) => ({
      ...prev,
      components: [...prev.components, { id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
    }));
  }
  function removeQuickMixComponent(index: number) {
    setQuickMix((prev) => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index),
    }));
  }

  function toOptionalString(value: string) {
    return value ? value : undefined;
  }

  // eslint-disable-next-line complexity
  async function submit() {
    const body = {
      visitDate: toOptionalString(visitDate),
      weight: toOptionalString(weight),
      temperature: toOptionalString(temperature),
      notes: toOptionalString(notes),
      doctorId: doctorId ? Number(doctorId) : undefined,
      paravetId: paravetId ? Number(paravetId) : undefined,
      urine: toOptionalString(urine),
      defecation: toOptionalString(defecation),
      appetite: toOptionalString(appetite),
      condition: toOptionalString(condition),
      symptoms: toOptionalString(symptoms),
      products: products
        .filter((p) => p.productId && p.quantity)
        .map((p) => ({ productId: Number(p.productId), quantity: p.quantity })),
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
    const saved = await res.json().catch(() => null);
    // Validasi stok untuk MIX berdasarkan konversi ke unit utama
    const mixDefMap = new Map(mixList.map((m) => [String(m.id), m]));
    for (const m of mixItems.filter((x) => x.mixProductId && x.quantity)) {
      const def = mixDefMap.get(String(m.mixProductId));
      if (!def?.components?.length) continue;
      // cek setiap komponen
      for (const comp of def.components) {
        const prod = productsList.find((p) => p.id === comp.productId);
        if (!prod) continue;
        const denom = prod.unitContentAmount ? Number(prod.unitContentAmount) : undefined;
        const baseQtyNum = Number(comp.quantityBase);
        const needInner = (Number.isFinite(baseQtyNum) ? baseQtyNum : 0) * Number(m.quantity);
        const needPrimary = denom && denom > 0 ? needInner / denom : needInner;
        const availRes = await fetch(`/api/inventory/${comp.productId}/available`, { cache: "no-store" });
        const available = availRes.ok ? await availRes.json().catch(() => 0) : 0;
        if (Number(available) < needPrimary) {
          toast.error(
            `Stok tidak cukup untuk komponen mix (butuh ${needPrimary} ${prod.unit ?? "unit"}, tersedia ${available})`,
          );
          return;
        }
      }
    }
    // gunakan mix (akan expand ke OUT oleh backend)
    const mixesToUse = mixItems.filter((m) => m.mixProductId && m.quantity);
    if (mixesToUse.length) {
      await Promise.all(
        mixesToUse.map((m) =>
          fetch(`/api/bookings/${bookingId}/pets/${bookingPetId}/mix-usage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mixProductId: Number(m.mixProductId), quantity: m.quantity, visitId: saved?.id }),
          }),
        ),
      );
    }
    // Handle quick mix
    const quickMixToUse = quickMix.components.filter((c) => c.productId && c.quantity);
    if (quickMixToUse.length > 0) {
      // Validate stock for quick mix components
      for (const comp of quickMixToUse) {
        const prod = productsList.find((p) => String(p.id) === comp.productId);
        if (!prod) continue;
        const availRes = await fetch(`/api/inventory/${comp.productId}/available`, { cache: "no-store" });
        const available = availRes.ok ? await availRes.json().catch(() => 0) : 0;
        if (Number(available) < Number(comp.quantity)) {
          toast.error(
            `Stok tidak cukup untuk komponen quick mix (butuh ${comp.quantity} ${prod.unit ?? "unit"}, tersedia ${available})`,
          );
          return;
        }
      }

      // Create quick mix
      await fetch(`/api/bookings/${bookingId}/pets/${bookingPetId}/quick-mix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mixName: quickMix.name || `Quick Mix - ${new Date().toISOString().slice(0, 10)}`,
          components: quickMixToUse.map((c) => ({
            productId: Number(c.productId),
            quantity: c.quantity,
          })),
          visitId: saved?.id,
        }),
      });
    }
    toast.success("Visit tersimpan");
    setVisitDate("");
    setWeight("");
    setTemperature("");
    setNotes("");
    setDoctorId("");
    setUrine("");
    setDefecation("");
    setAppetite("");
    setCondition("");
    setSymptoms("");
    setProducts([{ id: Math.random().toString(36).slice(2), productId: "", productName: "", quantity: "" }]);
    setMixItems([{ id: Math.random().toString(36).slice(2), mixProductId: "", quantity: "" }]);
    setQuickMix({
      name: "",
      components: [{ id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
    });
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
            <Label className="mb-2 block">Nama Pemilik</Label>
            <Input value={ownerName ?? "-"} readOnly />
          </div>
          <div>
            <Label className="mb-2 block">Nama Pet</Label>
            <Input value={petName ?? "-"} readOnly />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <Label className="mb-2 block">Tanggal Visit (opsional)</Label>
            <Input
              type="datetime-local"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              min={minDate}
              max={maxDate}
            />
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
            <Label className="mb-2 block">Nama Dokter</Label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            >
              <option value="">Pilih Nama Dokter</option>
              {doctors.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="mb-2 block">Nama Paravet</Label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={paravetId}
              onChange={(e) => setParavetId(e.target.value)}
            >
              <option value="">Pilih Nama Paravet</option>
              {paravets.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <Label className="mb-2 block">Urine</Label>
            <Input value={urine} onChange={(e) => setUrine(e.target.value)} placeholder="" />
          </div>
          <div>
            <Label className="mb-2 block">Def</Label>
            <Input value={defecation} onChange={(e) => setDefecation(e.target.value)} placeholder="" />
          </div>
          <div>
            <Label className="mb-2 block">App</Label>
            <Input value={appetite} onChange={(e) => setAppetite(e.target.value)} placeholder="" />
          </div>
          {/* removed duplicate Temp field */}
        </div>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label className="mb-2 block">Kondisi</Label>
            <Textarea value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="Kondisi saat ini" />
          </div>
          <div>
            <Label className="mb-2 block">Gejala</Label>
            <Textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Gejala" />
          </div>
          <div>
            <Label className="mb-2 block">Catatan</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan visit" />
          </div>
        </div>
        <div className="grid gap-2">
          <div className="text-sm font-medium">Produk yang dipakai</div>
          {products.map((p, i) => (
            <div key={p.id} className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <select
                className="rounded-md border px-3 py-2"
                value={p.productId}
                onChange={(e) => {
                  const pid = e.target.value;
                  const name = productsList.find((x) => String(x.id) === pid)?.name ?? "";
                  setProduct(i, "productId", pid);
                  setProduct(i, "productName", name);
                }}
              >
                <option value="">Pilih Produk</option>
                {productsList.map((prd) => (
                  <option key={prd.id} value={String(prd.id)}>
                    {prd.name}
                  </option>
                ))}
              </select>
              <div className="relative">
                <Input
                  className="pr-16"
                  placeholder={`Qty (dalam ${productsList.find((x) => String(x.id) === p.productId)?.unit ?? "unit"})`}
                  value={p.quantity}
                  onChange={(e) => setProduct(i, "quantity", e.target.value)}
                />
                <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs">
                  {productsList.find((x) => String(x.id) === p.productId)?.unit ?? "unit"}
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
          {mixItems.map((m, i) => {
            // Cari label satuan isi jika seluruh komponen mix punya unitContentName yang sama
            const def = mixList.find((x) => String(x.id) === m.mixProductId);
            const componentUnits = (def?.components ?? [])
              .map((c) => productsList.find((p) => p.id === c.productId)?.unitContentName)
              .filter(Boolean);
            const uniformUnit =
              componentUnits.length && componentUnits.every((u) => u === componentUnits[0]) ? componentUnits[0] : "isi";
            return (
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
                <div className="relative">
                  <Input
                    className="pr-16"
                    placeholder={`Qty (dalam ${String(uniformUnit)})`}
                    value={m.quantity}
                    onChange={(e) => setMixItem(i, "quantity", e.target.value)}
                  />
                  <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs">
                    {String(uniformUnit)}
                  </span>
                </div>
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
            );
          })}
          <div className="text-muted-foreground text-xs">Opsional: mix akan di-expand ke produk & stok</div>
        </div>
        <div className="grid gap-2">
          <div className="text-sm font-medium">Quick Mix (Racikan Cepat)</div>
          <Input
            placeholder="Nama Mix (opsional)"
            value={quickMix.name}
            onChange={(e) => setQuickMix((prev) => ({ ...prev, name: e.target.value }))}
          />
          {quickMix.components.map((comp, i) => (
            <div key={comp.id} className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <select
                className="rounded-md border px-3 py-2"
                value={comp.productId}
                onChange={(e) => setQuickMixComponent(i, "productId", e.target.value)}
              >
                <option value="">Pilih Produk</option>
                {productsList.map((prd) => (
                  <option key={prd.id} value={String(prd.id)}>
                    {prd.name}
                  </option>
                ))}
              </select>
              <div className="relative">
                <Input
                  className="pr-16"
                  placeholder={`Qty (dalam ${productsList.find((x) => String(x.id) === comp.productId)?.unit ?? "unit"})`}
                  value={comp.quantity}
                  onChange={(e) => setQuickMixComponent(i, "quantity", e.target.value)}
                />
                <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs">
                  {productsList.find((x) => String(x.id) === comp.productId)?.unit ?? "unit"}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => removeQuickMixComponent(i)}
                  disabled={quickMix.components.length <= 1}
                >
                  Hapus
                </Button>
                {i === quickMix.components.length - 1 && (
                  <Button variant="secondary" onClick={addQuickMixComponent}>
                    Tambah
                  </Button>
                )}
              </div>
            </div>
          ))}
          <div className="text-muted-foreground text-xs">
            Opsional: quick mix akan dibuat sementara dan di-expand ke produk & stok
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={submit}>Simpan Visit</Button>
        </div>
      </CardContent>
    </Card>
  );
}
