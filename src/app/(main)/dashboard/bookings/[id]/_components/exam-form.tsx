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
import { ExamProducts } from "./exam-products";
import { ExamMix } from "./exam-mix";

export function ExamForm({
  bookingId,
  bookingPetId,
  mode,
  externalControls,
  register,
  initial,
}: {
  bookingId: number;
  bookingPetId: number;
  mode?: "perDay" | "default";
  externalControls?: boolean;
  register?: (fn: () => Promise<boolean>) => void;
  initial?: {
    weight?: string | number;
    temperature?: string | number;
    notes?: string;
    products?: Array<{ productName: string; quantity: string | number }>;
    mixes?: Array<{ mixProductId: string | number; quantity: string | number }>;
  };
}) {
  const router = useRouter();
  const [weight, setWeight] = React.useState("");
  const [temperature, setTemperature] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [chiefComplaint, setChiefComplaint] = React.useState("");
  const [additionalNotes, setAdditionalNotes] = React.useState("");
  const [diagnosis, setDiagnosis] = React.useState("");
  const [prognosis, setPrognosis] = React.useState("");
  const [products, setProducts] = React.useState<Array<{ id: string; productName: string; quantity: string }>>([
    { id: Math.random().toString(36).slice(2), productName: "", quantity: "" },
  ]);
  const [productsList, setProductsList] = React.useState<Array<{ id: number; name: string }>>([]);
  const [mixList, setMixList] = React.useState<Array<{ id: number; name: string }>>([]);
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
  const [staff, setStaff] = React.useState<Array<{ id: number; name: string; jobRole: string }>>([]);
  const [paravetId, setParavetId] = React.useState("");
  const [doctorId, setDoctorId] = React.useState("");

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
      const resStaff = await fetch("/api/staff", { cache: "no-store" });
      if (resStaff.ok) {
        const data = await resStaff.json();
        setStaff(Array.isArray(data) ? data.map((s: any) => ({ id: s.id, name: s.name, jobRole: s.jobRole })) : []);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (!initial) return;
    if (initial.weight !== undefined) setWeight(String(initial.weight ?? ""));
    if (initial.temperature !== undefined) setTemperature(String(initial.temperature ?? ""));
    if (initial.notes !== undefined) setNotes(initial.notes ?? "");
    if (Array.isArray(initial.products) && initial.products.length) {
      setProducts(
        initial.products.map((p) => ({
          id: Math.random().toString(36).slice(2),
          productName: String(p.productName ?? ""),
          quantity: String(p.quantity ?? ""),
        })),
      );
    }
    if (Array.isArray(initial.mixes) && initial.mixes.length) {
      setMixItems(
        initial.mixes.map((m) => ({
          id: Math.random().toString(36).slice(2),
          mixProductId: String(m.mixProductId ?? ""),
          quantity: String(m.quantity ?? ""),
        })),
      );
    }
  }, [initial]);

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

  async function submit(options?: { silent?: boolean }) {
    const body = {
      weight: weight?.length ? weight : undefined,
      temperature: temperature?.length ? temperature : undefined,
      notes: notes?.length ? notes : undefined,
      chiefComplaint: chiefComplaint || undefined,
      additionalNotes: additionalNotes || undefined,
      diagnosis: diagnosis || undefined,
      prognosis: prognosis || undefined,
      doctorId: doctorId ? Number(doctorId) : undefined,
      paravetId: paravetId ? Number(paravetId) : undefined,
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
      let detail: string | undefined;
      try {
        const err = await res.json();
        detail = err?.message ?? err?.error ?? (typeof err === "string" ? err : undefined);

        console.warn("Submit pemeriksaan gagal:", res.status, err);
      } catch {
        try {
          const text = await res.text();
          detail = text;
        } catch {
          // ignore
        }
      }
      if (!options?.silent) {
        toast.error(detail ? `Gagal menyimpan pemeriksaan: ${detail}` : "Gagal menyimpan pemeriksaan");
      }
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
          if (!options?.silent) {
            toast.error(
              `Stok tidak cukup untuk komponen quick mix (butuh ${comp.quantity} unit, tersedia ${available})`,
            );
          }
          return false;
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
          examinationId: saved?.id,
        }),
      });
    }
    toast.success("Pemeriksaan tersimpan");
    setWeight("");
    setTemperature("");
    setNotes("");
    setChiefComplaint("");
    setAdditionalNotes("");
    setDiagnosis("");
    setPrognosis("");
    setProducts([{ id: Math.random().toString(36).slice(2), productName: "", quantity: "" }]);
    setMixItems([{ id: Math.random().toString(36).slice(2), mixProductId: "", quantity: "" }]);
    setQuickMix({
      name: "",
      components: [{ id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
    });
    router.refresh();
    return true;
  }

  React.useEffect(() => {
    if (externalControls && register) {
      // Daftarkan submit non-silent agar error ditampilkan lewat toast
      register(() => submit());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalControls, register, weight, temperature, notes, products, mixItems]);

  if (externalControls) {
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
                <Input
                  placeholder="Qty"
                  value={m.quantity}
                  onChange={(e) => setMixItem(i, "quantity", e.target.value)}
                />
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
                    className="pr-20"
                    placeholder="Qty (dalam unit utama)"
                    value={comp.quantity}
                    onChange={(e) => setQuickMixComponent(i, "quantity", e.target.value)}
                  />
                  <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs">
                    unit
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
              Opsional: quick mix akan dibuat sementara dan di-expand ke produk
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tambah Pemeriksaan</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {/* Paravet & Dokter */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <Label className="mb-2 block">Paravet</Label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={paravetId}
              onChange={(e) => setParavetId(e.target.value)}
            >
              <option value="">Pilih Paravet</option>
              {staff
                .filter((s) => s.jobRole === "PARAVET")
                .map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <Label className="mb-2 block">Dokter</Label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            >
              <option value="">Pilih Dokter</option>
              {staff
                .filter((s) => s.jobRole === "DOCTOR")
                .map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
          <div />
        </div>

        {/* Anamnesis & Catatan */}
        <div className="grid gap-3 rounded-md border p-3">
          <div className="text-sm font-medium">Anamnesis & Catatan</div>
          <div>
            <Label className="mb-2 block">Anamnesis/Keluhan</Label>
            <Textarea
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="Keluhan utama"
            />
          </div>
          <div>
            <Label className="mb-2 block">Catatan Tambahan</Label>
            <Textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Catatan tambahan (opsional)"
            />
          </div>
        </div>

        {/* Berat & Suhu */}
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

        {/* Diagnosis & Prognosis */}
        <div className="grid gap-3 rounded-md border p-3">
          <div className="text-sm font-medium">Diagnosis & Prognosis</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label className="mb-2 block">Diagnosis</Label>
              <Input
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Tambahkan diagnosis"
              />
            </div>
            <div>
              <Label className="mb-2 block">Prognosis</Label>
              <Input
                value={prognosis}
                onChange={(e) => setPrognosis(e.target.value)}
                placeholder="Tambahkan prognosis"
              />
            </div>
          </div>
        </div>

        <ExamProducts
          products={products}
          productsList={productsList}
          setProduct={setProduct}
          addProduct={addProduct}
          removeProduct={removeProduct}
        />

        <ExamMix
          mixItems={mixItems}
          mixList={mixList}
          setMixItem={setMixItem}
          addMixItem={addMixItem}
          removeMixItem={removeMixItem}
        />

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
                  className="pr-20"
                  placeholder="Qty (dalam unit utama)"
                  value={comp.quantity}
                  onChange={(e) => setQuickMixComponent(i, "quantity", e.target.value)}
                />
                <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs">
                  unit
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
            Opsional: quick mix akan dibuat sementara dan di-expand ke produk
          </div>
        </div>

        {mode === "perDay" ? (
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
                // Coba simpan pemeriksaan diam-diam; jika gagal, tetap lanjut ke deposit
                await submit({ silent: true });
                await fetch(`/api/bookings/${bookingId}`, { method: "PATCH" });
                router.push(`/dashboard/bookings/${bookingId}/deposit`);
              }}
            >
              Lanjutkan ke Deposit
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                const ok = await submit();
                if (ok) {
                  await fetch(`/api/bookings/${bookingId}/billing/checkout`, { method: "POST" });
                  router.push(`/dashboard/bookings`);
                }
              }}
            >
              Selesai
            </Button>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button onClick={() => submit()}>Simpan Pemeriksaan</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
