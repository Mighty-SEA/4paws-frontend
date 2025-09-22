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
  const [adminId, setAdminId] = React.useState("");
  const [groomerId, setGroomerId] = React.useState("");
  const [paravets, setParavets] = React.useState<Array<{ id: number; name: string }>>([]);
  const [admins, setAdmins] = React.useState<Array<{ id: number; name: string }>>([]);
  const [groomers, setGroomers] = React.useState<Array<{ id: number; name: string }>>([]);
  const [urine, setUrine] = React.useState("");
  const [defecation, setDefecation] = React.useState("");
  const [appetite, setAppetite] = React.useState("");
  const [condition, setCondition] = React.useState("");
  const [symptoms, setSymptoms] = React.useState("");
  const [productsList, setProductsList] = React.useState<
    Array<{ id: number; name: string; unit?: string; unitContentAmount?: string; unitContentName?: string }>
  >([]);
  // Addon selector for visit
  const [serviceTypes, setServiceTypes] = React.useState<Array<{ id: number; name: string }>>([]);
  const [addonServiceTypeId, setAddonServiceTypeId] = React.useState("");
  // qty not needed; default to 1 on submit
  // Mix template removed for Visit; use only Quick Mix
  const [products, setProducts] = React.useState<
    Array<{ id: string; productId: string; productName: string; quantity: string }>
  >([{ id: Math.random().toString(36).slice(2), productId: "", productName: "", quantity: "" }]);
  // mixItems removed
  const [quickMix, setQuickMix] = React.useState<{
    name: string;
    price: string;
    components: Array<{ id: string; productId: string; quantity: string }>;
  }>({
    name: "",
    price: "",
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
      const resTypes = await fetch("/api/service-types", { cache: "no-store" });
      if (resTypes.ok) {
        const data = await resTypes.json();
        setServiceTypes(Array.isArray(data) ? data.map((t: any) => ({ id: t.id, name: t.name })) : []);
      }
      // no mix-products needed for Visit anymore
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
        setAdmins(
          Array.isArray(data)
            ? data.filter((s: any) => s.jobRole === "ADMIN").map((s: any) => ({ id: s.id, name: s.name }))
            : [],
        );
        setGroomers(
          Array.isArray(data)
            ? data.filter((s: any) => s.jobRole === "GROOMER").map((s: any) => ({ id: s.id, name: s.name }))
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
  // Removed mix template handlers
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
      adminId: adminId ? Number(adminId) : undefined,
      groomerId: groomerId ? Number(groomerId) : undefined,
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
    // If addon selected, create addon booking item immediately
    if (addonServiceTypeId) {
      const when = visitDate || new Date().toISOString().slice(0, 16);
      const whenIso = new Date(when).toISOString();
      await fetch(`/api/bookings/${bookingId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceTypeId: Number(addonServiceTypeId),
          quantity: 1,
          role: "ADDON",
          startDate: whenIso,
          endDate: whenIso,
        }),
      }).catch(() => {});
    }
    // Handle quick mix
    const quickMixToUse = quickMix.components.filter((c) => c.productId && c.quantity);
    if (quickMixToUse.length > 0) {
      // Validate stock for quick mix components (convert inner to primary unit)
      for (const comp of quickMixToUse) {
        const prod = productsList.find((p) => String(p.id) === comp.productId);
        if (!prod) continue;
        const denom = prod.unitContentAmount ? Number(prod.unitContentAmount) : undefined;
        const needInner = Number(comp.quantity) || 0;
        const needPrimary = denom && denom > 0 ? needInner / denom : needInner;
        const availRes = await fetch(`/api/inventory/${comp.productId}/available`, { cache: "no-store" });
        const available = availRes.ok ? await availRes.json().catch(() => 0) : 0;
        if (Number(available) < needPrimary) {
          toast.error(
            `Stok tidak cukup untuk komponen quick mix (butuh ${needPrimary} ${prod.unit ?? "unit"}, tersedia ${available})`,
          );
          return;
        }
      }

      // Create quick mix
      const qmRes = await fetch(`/api/bookings/${bookingId}/pets/${bookingPetId}/quick-mix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mixName: quickMix.name || `Quick Mix - ${new Date().toISOString().slice(0, 10)}`,
          price: quickMix.price || undefined,
          components: quickMixToUse.map((c) => ({
            productId: Number(c.productId),
            quantity: c.quantity,
          })),
          visitId: saved?.id,
        }),
      });
      if (!qmRes.ok) {
        const errText = await qmRes.text().catch(() => "");
        toast.error(errText || "Gagal menyimpan Quick Mix");
        return;
      }
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
    // no mix items reset
    setQuickMix({
      name: "",
      price: "",
      components: [{ id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
    });
    setAddonServiceTypeId("");
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
            <Label className="mb-2 block">Addon (opsional)</Label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={addonServiceTypeId}
              onChange={(e) => setAddonServiceTypeId(e.target.value)}
            >
              <option value="">Pilih Addon</option>
              {serviceTypes.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.name}
                </option>
              ))}
            </select>
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
          <div>
            <Label className="mb-2 block">Admin (opsional)</Label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
            >
              <option value="">Pilih Admin</option>
              {admins.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="mb-2 block">Groomer (opsional)</Label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={groomerId}
              onChange={(e) => setGroomerId(e.target.value)}
            >
              <option value="">Pilih Groomer</option>
              {groomers.map((g) => (
                <option key={g.id} value={String(g.id)}>
                  {g.name}
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
        {/* Mix (template) removed for visit; use only Quick Mix */}
        <div className="grid gap-2">
          <div className="text-sm font-medium">Quick Mix (Racikan Cepat)</div>
          <Input
            placeholder="Nama Mix (opsional)"
            value={quickMix.name}
            onChange={(e) => setQuickMix((prev) => ({ ...prev, name: e.target.value }))}
          />
          <Input
            placeholder="Harga Mix (opsional)"
            value={quickMix.price}
            onChange={(e) => setQuickMix((prev) => ({ ...prev, price: e.target.value }))}
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
                  placeholder={`Qty (dalam ${
                    productsList.find((x) => String(x.id) === comp.productId)?.unitContentName ?? "isi per unit"
                  })`}
                  value={comp.quantity}
                  onChange={(e) => setQuickMixComponent(i, "quantity", e.target.value)}
                />
                <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs">
                  {productsList.find((x) => String(x.id) === comp.productId)?.unitContentName ?? "isi"}
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
