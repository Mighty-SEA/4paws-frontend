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
  booking,
  initial,
}: {
  bookingId: number;
  bookingPetId: number;
  ownerName?: string;
  petName?: string;
  minDate?: string;
  maxDate?: string;
  booking?: any;
  initial?: {
    visitDate?: string;
    weight?: string | number;
    temperature?: string | number;
    notes?: string;
    products?: Array<{ productName: string; quantity: string | number }>;
    mixes?: Array<{
      name?: string;
      price?: string | number;
      quantity?: string | number;
      components: Array<{ productId: number | string; quantityBase: string | number }>;
    }>;
  };
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
  const [isGrooming, setIsGrooming] = React.useState(false);
  const [urine, setUrine] = React.useState("");
  const [defecation, setDefecation] = React.useState("");
  const [appetite, setAppetite] = React.useState("");
  const [condition, setCondition] = React.useState("");
  const [symptoms, setSymptoms] = React.useState("");
  const [productsList, setProductsList] = React.useState<
    Array<{ id: number; name: string; unit?: string; unitContentAmount?: number; unitContentName?: string }>
  >([]);
  // Addon selector for visit
  const [serviceTypes, setServiceTypes] = React.useState<Array<{ id: number; name: string }>>([]);
  const [addonServiceTypeId, setAddonServiceTypeId] = React.useState("");
  // qty not needed; default to 1 on submit
  // Mix template removed for Visit; use only Quick Mix
  type ItemComponent = { id: string; productId: string; quantity: string };
  type ItemGroup = { id: string; label?: string; price?: string; components: ItemComponent[] };
  const [items, setItems] = React.useState<ItemGroup[]>([
    {
      id: Math.random().toString(36).slice(2),
      label: "",
      price: "55000",
      components: [{ id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
    },
  ]);
  // Initialize from initial prop (prefill last visit data)
  const initializedFromInitial = React.useRef(false);
  React.useEffect(() => {
    if (!initial || initializedFromInitial.current) return;
    const needProductsLookup = Array.isArray(initial.products) && initial.products.length > 0;
    if (needProductsLookup && productsList.length === 0) return; // wait until products loaded
    if (initial.visitDate) setVisitDate(initial.visitDate);
    if (initial.weight !== undefined) setWeight(String(initial.weight ?? ""));
    if (initial.temperature !== undefined) setTemperature(String(initial.temperature ?? ""));
    if (initial.notes !== undefined) setNotes(initial.notes ?? "");

    const nextItems: ItemGroup[] = [];
    // Map mixes first (become Item + multiple sub-items)
    if (Array.isArray(initial.mixes)) {
      for (const mix of initial.mixes) {
        const qty = Number(mix.quantity ?? 1) || 1;
        const components = Array.isArray(mix.components)
          ? mix.components.map((c) => ({
              id: Math.random().toString(36).slice(2),
              productId: String(c.productId),
              quantity: String((Number(c.quantityBase) || 0) * qty),
            }))
          : [];
        if (components.length) {
          nextItems.push({
            id: Math.random().toString(36).slice(2),
            label: mix.name ? String(mix.name) : "",
            price: mix.price != null ? String(mix.price) : "55000",
            components,
          });
        }
      }
    }
    // Map single product usages as standalone items
    if (Array.isArray(initial.products)) {
      for (const p of initial.products) {
        const prodId = String(productsList.find((x) => x.name === String(p.productName ?? ""))?.id ?? "");
        nextItems.push({
          id: Math.random().toString(36).slice(2),
          label: "",
          price: "55000",
          components: [
            {
              id: Math.random().toString(36).slice(2),
              productId: prodId,
              quantity: String(p.quantity ?? ""),
            },
          ],
        });
      }
    }
    if (nextItems.length) setItems(nextItems);
    initializedFromInitial.current = true;
  }, [initial, productsList]);
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

  // Detect grooming service
  React.useEffect(() => {
    if (!booking) return;

    try {
      // Check main service
      const svcName = String(booking?.serviceType?.service?.name ?? "").toLowerCase();
      const typeName = String(booking?.serviceType?.name ?? "").toLowerCase();
      const isMainGrooming = svcName.includes("groom") || typeName.includes("groom");

      // Check booking items for grooming addon
      const hasGroomingAddon =
        Array.isArray(booking?.items) &&
        booking.items.some((item: any) => {
          const itemSvcName = String(item?.serviceType?.service?.name ?? "").toLowerCase();
          const itemTypeName = String(item?.serviceType?.name ?? "").toLowerCase();
          return itemSvcName.includes("groom") || itemTypeName.includes("groom");
        });

      setIsGrooming(isMainGrooming || hasGroomingAddon);
    } catch {
      setIsGrooming(false);
    }
  }, [booking]);

  // Detect grooming addon selection
  React.useEffect(() => {
    if (!addonServiceTypeId) return;

    const selectedService = serviceTypes.find((st) => st.id === Number(addonServiceTypeId));
    if (selectedService) {
      const serviceName = selectedService.name.toLowerCase();
      if (serviceName.includes("groom")) {
        setIsGrooming(true);
      }
    }
  }, [addonServiceTypeId, serviceTypes]);

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        label: "",
        price: "55000",
        components: [{ id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
      },
    ]);
  }
  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }
  function setItemLabel(index: number, value: string) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, label: value } : it)));
  }
  function setItemPrice(index: number, value: string) {
    const digitsOnly = String(value ?? "").replace(/[^0-9]/g, "");
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, price: digitsOnly } : it)));
  }

  const formatThousands = (digits: string | undefined) => {
    const raw = String(digits ?? "").replace(/[^0-9]/g, "");
    if (!raw) return "";
    return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  function addComponent(itemIdx: number) {
    setItems((prev) =>
      prev.map((it, i) =>
        i === itemIdx
          ? {
              ...it,
              components: [...it.components, { id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
            }
          : it,
      ),
    );
  }
  function removeComponent(itemIdx: number, compIdx: number) {
    setItems((prev) =>
      prev.map((it, i) => (i === itemIdx ? { ...it, components: it.components.filter((_, j) => j !== compIdx) } : it)),
    );
  }
  function setComponent(itemIdx: number, compIdx: number, key: "productId" | "quantity", value: string) {
    setItems((prev) =>
      prev.map((it, i) =>
        i === itemIdx
          ? { ...it, components: it.components.map((c, j) => (j === compIdx ? { ...c, [key]: value } : c)) }
          : it,
      ),
    );
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
    const toNumberSafe = (v: unknown): number => {
      const n = typeof v === "number" ? v : Number(v ?? 0);
      return Number.isFinite(n) ? n : 0;
    };
    const toPrimaryQty = (productId: string, qtyInnerStr: string): string => {
      const prod = productsList.find((x) => String(x.id) === productId);
      const denom = prod?.unitContentAmount ? Number(prod.unitContentAmount) : undefined;
      const qtyInner = toNumberSafe(qtyInnerStr);
      if (denom && denom > 0) return String(qtyInner / denom);
      return String(qtyInner);
    };
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
      products: items.flatMap((it) => {
        const isMix = it.components.length > 1;
        if (isMix) return [];
        return it.components
          .filter((c) => c.productId && c.quantity)
          .map((c) => ({ productId: Number(c.productId), quantity: String(Number(c.quantity || 0)) }));
      }),
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
    // Handle item-based mix (Item + Sub-item) with price -> create temporary mix usage
    for (const it of items) {
      const isMix = it.components.length > 1;
      const comps = it.components.filter((c) => c.productId && c.quantity);
      if (!isMix || comps.length === 0) continue;
      // Optional price (required by user for mix). Allow empty -> 0
      const qmRes = await fetch(`/api/bookings/${bookingId}/pets/${bookingPetId}/quick-mix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mixName: it.label && it.label.trim().length ? it.label : `Mix - ${new Date().toISOString().slice(0, 10)}`,
          price: it.price === "" ? undefined : it.price,
          components: comps.map((c) => ({ productId: Number(c.productId), quantity: c.quantity })),
          visitId: saved?.id,
        }),
      });
      if (!qmRes.ok) {
        const errText = await qmRes.text().catch(() => "");
        toast.error(errText || "Gagal menyimpan Mix Item");
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
    setItems([
      {
        id: Math.random().toString(36).slice(2),
        label: "",
        components: [{ id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
      },
    ]);
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
          {isGrooming && (
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
          )}
          {null}
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
        {/* Items + Sub-items */}
        <div className="w-full">
          <div className="grid gap-3 rounded-md border p-3">
            <div className="text-sm font-medium">Item</div>
            {items.map((it, i) => (
              <div key={it.id} className="grid w-full gap-2 rounded-md border p-2">
                <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-6">
                  <div className="md:col-span-3">
                    <Label className="mb-2 block">Nama Item (opsional)</Label>
                    <Input
                      value={it.label ?? ""}
                      onChange={(e) => setItemLabel(i, e.target.value)}
                      placeholder="Contoh: Obat Racik A"
                    />
                  </div>
                  {it.components.length > 1 ? (
                    <div className="md:col-span-2">
                      <Label className="mb-2 block">Harga Mix (Rp)</Label>
                      <Input
                        value={formatThousands(it.price)}
                        onChange={(e) => setItemPrice(i, e.target.value)}
                        placeholder="55,000"
                        inputMode="decimal"
                      />
                    </div>
                  ) : null}
                  <div
                    className={`${it.components.length > 1 ? "md:col-span-1" : "md:col-span-3"} flex items-end justify-end`}
                  >
                    <Button variant="outline" onClick={() => removeItem(i)} disabled={items.length <= 1}>
                      Hapus Item
                    </Button>
                  </div>
                </div>
                <div className="grid w-full gap-2">
                  {it.components.map((c, j) => {
                    const prod = productsList.find((x) => String(x.id) === c.productId);
                    const unitLabel = prod?.unitContentName ?? prod?.unit ?? "unit";
                    return (
                      <div key={c.id} className="grid w-full grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto_auto]">
                        <select
                          className="w-full rounded-md border px-3 py-2"
                          value={c.productId}
                          onChange={(e) => setComponent(i, j, "productId", e.target.value)}
                        >
                          <option value="">Pilih Produk</option>
                          {productsList.map((p) => (
                            <option key={p.id} value={String(p.id)}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <div className="relative">
                          <Input
                            className="w-full pr-16"
                            placeholder={`Qty (${it.components.length > 1 ? `dalam ${unitLabel}` : `dalam ${prod?.unit ?? unitLabel}`})`}
                            value={c.quantity}
                            onChange={(e) => setComponent(i, j, "quantity", e.target.value)}
                          />
                          <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs">
                            {it.components.length > 1 ? unitLabel : (prod?.unit ?? unitLabel)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Button
                            variant="outline"
                            onClick={() => removeComponent(i, j)}
                            disabled={it.components.length <= 1}
                          >
                            Hapus
                          </Button>
                        </div>
                        {j === it.components.length - 1 ? (
                          <div className="flex items-center">
                            <Button variant="secondary" onClick={() => addComponent(i)}>
                              Tambah Sub-item
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <div className="invisible">
                              <Button variant="secondary">Tambah Sub-item</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="flex justify-end">
              <Button variant="secondary" onClick={addItem}>
                Tambah Item
              </Button>
            </div>
          </div>
        </div>
        {/* Quick Mix removed */}
        <div className="flex justify-end">
          <Button onClick={submit}>Simpan Visit</Button>
        </div>
      </CardContent>
    </Card>
  );
}
