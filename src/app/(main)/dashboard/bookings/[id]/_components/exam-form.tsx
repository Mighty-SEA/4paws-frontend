"use client";
/* eslint-disable import/order */

import * as React from "react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ProceedToDepositButton } from "./proceed-to-deposit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
// import { ExamProducts } from "./exam-products";

export function ExamForm({
  bookingId,
  bookingPetId,
  mode,
  externalControls,
  register,
  initial,
  isGroomingService,
  isPetshop,
}: {
  bookingId: number;
  bookingPetId: number;
  mode?: "perDay" | "default";
  externalControls?: boolean;
  register?: (fn: () => Promise<boolean>) => void;
  isGroomingService?: boolean;
  isPetshop?: boolean;
  initial?: {
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
  const submitRef = React.useRef<() => Promise<boolean>>();
  const [weight, setWeight] = React.useState("");
  const [temperature, setTemperature] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [chiefComplaint, setChiefComplaint] = React.useState("");
  const [additionalNotes, setAdditionalNotes] = React.useState("");
  const [diagnoses, setDiagnoses] = React.useState<Array<{ id: string; value: string }>>([
    { id: Math.random().toString(36).slice(2), value: "" },
  ]);
  const [prognosis, setPrognosis] = React.useState("");
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
  const [productsList, setProductsList] = React.useState<
    Array<{ id: number; name: string; unit?: string; unitContentAmount?: number; unitContentName?: string }>
  >([]);
  // Quick Mix removed
  const [staff, setStaff] = React.useState<Array<{ id: number; name: string; jobRole: string }>>([]);
  const [paravetId, setParavetId] = React.useState("");
  const [doctorId, setDoctorId] = React.useState("");
  const [adminId, setAdminId] = React.useState("");
  const [groomerId, setGroomerId] = React.useState("");
  const isGrooming = isGroomingService ?? false;
  const [isPerDay, setIsPerDay] = React.useState(false);
  const isDirtyRef = React.useRef(false);

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
      const resStaff = await fetch("/api/staff", { cache: "no-store" });
      if (resStaff.ok) {
        const data = await resStaff.json();
        setStaff(Array.isArray(data) ? data.map((s: any) => ({ id: s.id, name: s.name, jobRole: s.jobRole })) : []);
      }
      // detect grooming and per-day service types
      try {
        const resBooking = await fetch(`/api/bookings/${bookingId}`, { cache: "no-store" });
        if (resBooking.ok) {
          const bk = await resBooking.json();
          const svcName = String(bk?.serviceType?.service?.name ?? "")
            .trim()
            .toLowerCase();
          const typeName = String(bk?.serviceType?.name ?? "")
            .trim()
            .toLowerCase();
          // grooming detection now handled by props
          const perDay = /rawat inap|pet hotel/i.test(svcName);
          setIsPerDay(perDay);
        } else {
          setIsPerDay(false);
        }
      } catch {
        setIsPerDay(false);
      }
    })();
  }, []);

  const initializedFromInitial = React.useRef(false);
  React.useEffect(() => {
    if (!initial || initializedFromInitial.current || isDirtyRef.current) return;
    const needProductsLookup = Array.isArray(initial.products) && initial.products.length > 0;
    if (needProductsLookup && productsList.length === 0) return; // wait until products loaded
    if (initial.weight !== undefined) setWeight(String(initial.weight ?? ""));
    if (initial.temperature !== undefined) setTemperature(String(initial.temperature ?? ""));
    if (initial.notes !== undefined) setNotes(initial.notes ?? "");
    if ((initial as any).chiefComplaint !== undefined) setChiefComplaint(String((initial as any).chiefComplaint ?? ""));
    if ((initial as any).additionalNotes !== undefined)
      setAdditionalNotes(String((initial as any).additionalNotes ?? ""));
    if ((initial as any).diagnosis !== undefined) {
      const diag = String((initial as any).diagnosis ?? "").trim();
      setDiagnoses(
        diag
          ? diag.split(/;\s*/).map((v) => ({ id: Math.random().toString(36).slice(2), value: v }))
          : [{ id: Math.random().toString(36).slice(2), value: "" }],
      );
    }
    if ((initial as any).prognosis !== undefined) setPrognosis(String((initial as any).prognosis ?? ""));
    if ((initial as any).doctorId) setDoctorId(String((initial as any).doctorId));
    if ((initial as any).paravetId) setParavetId(String((initial as any).paravetId));
    if ((initial as any).adminId) setAdminId(String((initial as any).adminId));
    if ((initial as any).groomerId) setGroomerId(String((initial as any).groomerId));
    const nextItems: ItemGroup[] = [];
    if (Array.isArray(initial.mixes)) {
      for (const mix of initial.mixes as Array<{
        name?: string;
        price?: string | number;
        quantity?: string | number;
        components?: Array<{ productId: number | string; quantityBase: string | number }>;
      }>) {
        const qty = Number(mix.quantity ?? 1) || 1;
        const components = Array.isArray(mix.components)
          ? mix.components.map((c: { productId: number | string; quantityBase: string | number }) => ({
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
    if (Array.isArray(initial.products) && initial.products.length) {
      for (const p of initial.products) {
        nextItems.push({
          id: Math.random().toString(36).slice(2),
          label: "",
          price: "55000",
          components: [
            {
              id: Math.random().toString(36).slice(2),
              productId: (() => {
                const byName = productsList.find((x) => x.name === String((p as any).productName ?? ""))?.id;
                const asId = Number((p as any).productId ?? NaN);
                return byName ? String(byName) : Number.isInteger(asId) ? String(asId) : "";
              })(),
              quantity: String(p.quantity ?? ""),
            },
          ],
        });
      }
    }
    if (nextItems.length) setItems(nextItems);
    initializedFromInitial.current = true;
  }, [initial, productsList]);

  function addItem() {
    isDirtyRef.current = true;
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
    isDirtyRef.current = true;
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) {
        return [
          {
            id: Math.random().toString(36).slice(2),
            label: "",
            price: "55000",
            components: [{ id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
          },
        ];
      }
      return next;
    });
  }
  function setItemLabel(index: number, value: string) {
    isDirtyRef.current = true;
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, label: value } : it)));
  }
  function setItemPrice(index: number, value: string) {
    const digitsOnly = String(value ?? "").replace(/[^0-9]/g, "");
    isDirtyRef.current = true;
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, price: digitsOnly } : it)));
  }

  const formatThousands = (digits: string | undefined) => {
    const raw = String(digits ?? "").replace(/[^0-9]/g, "");
    if (!raw) return "";
    return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  function addComponent(itemIdx: number) {
    isDirtyRef.current = true;
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
    isDirtyRef.current = true;
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== itemIdx) return it;
        const nextComps = it.components.filter((_, j) => j !== compIdx);
        return {
          ...it,
          components:
            nextComps.length > 0
              ? nextComps
              : [{ id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
        };
      }),
    );
  }
  function setComponent(itemIdx: number, compIdx: number, key: "productId" | "quantity", value: string) {
    isDirtyRef.current = true;
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== itemIdx) return it;

        const previousFirstProductId = it.components?.[0]?.productId ?? "";
        const previousFirstProductName = productsList.find(
          (x) => String(x.id) === String(previousFirstProductId),
        )?.name;

        const updatedComponents = it.components.map((c, j) => (j === compIdx ? { ...c, [key]: value } : c));

        let updatedLabel = it.label ?? "";
        if (key === "productId" && compIdx === 0) {
          const newFirstProductName = productsList.find((x) => String(x.id) === String(value))?.name ?? "";
          const labelIsEmpty = (updatedLabel ?? "").trim().length === 0;
          const labelMatchesPrevFirst = previousFirstProductName && updatedLabel === previousFirstProductName;
          if (labelIsEmpty || labelMatchesPrevFirst) {
            updatedLabel = newFirstProductName;
          }
        }

        return { ...it, components: updatedComponents, label: updatedLabel };
      }),
    );
  }

  // Quick Mix handlers removed

  async function submit(options?: { silent?: boolean }) {
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
    const isEditing = Boolean(initial);
    const body: any = {
      weight: weight?.length ? weight : undefined,
      temperature: temperature?.length ? temperature : undefined,
      notes: notes?.length ? notes : undefined,
      chiefComplaint: chiefComplaint || undefined,
      additionalNotes: additionalNotes || undefined,
      diagnosis:
        diagnoses
          .map((d) => String(d.value).trim())
          .filter((s) => !!s)
          .join("; ") || undefined,
      prognosis: prognosis || undefined,
      doctorId: doctorId ? Number(doctorId) : undefined,
      paravetId: paravetId ? Number(paravetId) : undefined,
      products: items.flatMap((it) => {
        const isMix = it.components.length > 1;
        if (isMix) return [];
        return it.components
          .filter((c) => c.productId && c.quantity)
          .map((c) => ({
            productId: Number(c.productId),
            productName: String(productsList.find((x) => String(x.id) === c.productId)?.name ?? ""),
            quantity: isPetshop
              ? toPrimaryQty(String(c.productId), String(c.quantity))
              : String(Number(c.quantity || 0)),
          }));
      }),
      adminId: adminId ? Number(adminId) : undefined,
      groomerId: groomerId ? Number(groomerId) : undefined,
    };
    // Always send mixes (both create and edit) so backend can append/update
    body.mixes = items
      .filter((it) => it.components.length > 1)
      .map((it) => ({
        mixName: it.label && it.label.trim().length ? it.label : undefined,
        price: it.price === "" ? undefined : it.price,
        components: it.components
          .filter((c) => c.productId && c.quantity)
          .map((c) => ({ productId: Number(c.productId), quantity: c.quantity })),
      }));
    console.log("=== EXAM FORM SUBMIT ===");
    console.log("Is Editing:", isEditing);
    console.log("Body to send:", JSON.stringify(body, null, 2));

    // On edit, use replace-all endpoint to guarantee deletions persist
    if (isEditing) {
      const singles = items
        .filter((it) => it.components.length === 1)
        .flatMap((it) =>
          it.components
            .filter((c) => c.productId && c.quantity)
            .map((c) => ({
              productId: Number(c.productId),
              quantity: isPetshop
                ? toPrimaryQty(String(c.productId), String(c.quantity))
                : String(Number(c.quantity || 0)),
            })),
        );
      const mixesPayload = items
        .filter((it) => it.components.length > 1)
        .map((it) => ({
          label: it.label,
          price: it.price,
          components: it.components
            .filter((c) => c.productId && c.quantity)
            .map((c) => ({ productId: Number(c.productId), quantity: String(Number(c.quantity || 0)) })),
        }))
        .filter((m) => m.components.length > 0);

      const meta: any = {
        weight: weight?.length ? weight : undefined,
        temperature: temperature?.length ? temperature : undefined,
        notes: notes?.length ? notes : undefined,
        chiefComplaint: chiefComplaint || undefined,
        additionalNotes: additionalNotes || undefined,
        diagnosis:
          diagnoses
            .map((d) => String(d.value).trim())
            .filter((s) => !!s)
            .join("; ") || undefined,
        prognosis: prognosis || undefined,
        doctorId: doctorId ? Number(doctorId) : undefined,
        paravetId: paravetId ? Number(paravetId) : undefined,
        adminId: adminId ? Number(adminId) : undefined,
        groomerId: groomerId ? Number(groomerId) : undefined,
      };

      const res = await fetch(`/api/bookings/${bookingId}/pets/${bookingPetId}/examinations/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meta, singles, mixes: mixesPayload }),
      });
      if (!res.ok) {
        let detail: string | undefined;
        try {
          const err = await res.json();
          detail = err?.message ?? err?.error ?? (typeof err === "string" ? err : undefined);
        } catch (e) {
          detail = undefined; // ignore JSON parse errors
        }
        if (!options?.silent) {
          toast.error(
            detail
              ? `Gagal menyimpan ${isPetshop ? "pemesanan" : "pemeriksaan"}: ${detail}`
              : `Gagal menyimpan ${isPetshop ? "pemesanan" : "pemeriksaan"}`,
          );
        }
        return false;
      }
      await res.json().catch(() => null);
    } else {
      const url = `/api/bookings/${bookingId}/pets/${bookingPetId}/examinations`;
      let res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      // If failed, try to parse error and optionally retry with PUT
      let detail: string | undefined = undefined;
      if (!res.ok) {
        try {
          const err = await res.json();
          detail = err?.message ?? err?.error ?? (typeof err === "string" ? err : undefined);
        } catch (e) {
          detail = undefined;
        }
        const msg = String(detail ?? "").toLowerCase();
        const shouldRetryWithPut =
          res.status === 400 &&
          (msg.includes("sudah dilakukan") || msg.includes("sudah tersimpan") || msg.includes("already"));
        if (shouldRetryWithPut) {
          res = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        }
      }
      if (!res.ok) {
        if (!detail) {
          try {
            const text = await res.text();
            detail = text;
          } catch (e) {
            detail = undefined;
          }
        }
        if (!options?.silent) {
          toast.error(
            detail
              ? `Gagal menyimpan ${isPetshop ? "pemesanan" : "pemeriksaan"}: ${detail}`
              : `Gagal menyimpan ${isPetshop ? "pemesanan" : "pemeriksaan"}`,
          );
        }
        return false;
      }
      await res.json().catch(() => null);
    }
    // done: per-branch error handling already performed above

    // Do not auto-change booking status here.
    // Status transitions are handled explicitly via dedicated actions
    // (e.g., Proceed to Deposit or Payment/Checkout).
    if (!externalControls) {
      toast.success(isPetshop ? "Pemesanan tersimpan" : "Pemeriksaan tersimpan");
      // Redirect back to booking detail after save
      router.push(`/dashboard/bookings/${bookingId}`);
      return true;
    }
    setWeight("");
    setTemperature("");
    setNotes("");
    setChiefComplaint("");
    setAdditionalNotes("");
    setDiagnoses([{ id: Math.random().toString(36).slice(2), value: "" }]);
    setPrognosis("");
    setItems([
      {
        id: Math.random().toString(36).slice(2),
        label: "",
        price: "",
        components: [{ id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
      },
    ]);
    // quick mix removed
    if (!externalControls) {
      router.refresh();
    }
    return true;
  }

  // Keep latest submit in a ref so external controller calls always use fresh state
  React.useEffect(() => {
    submitRef.current = submit;
  });

  const hasRegistered = React.useRef(false);
  React.useEffect(() => {
    if (externalControls && register && !hasRegistered.current) {
      register(() => (submitRef.current ? submitRef.current() : Promise.resolve(false)));
      hasRegistered.current = true;
    }
    // We intentionally register only once per form instance
  }, [externalControls, register]);

  if (externalControls) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tambah {isPetshop ? "Pemesanan" : "Pemeriksaan"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {/* Paravet, Dokter, Admin, Groomer (opsional) */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            {!isPetshop ? (
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
            ) : null}
            {!isPetshop ? (
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
            ) : null}
            {isPetshop ? (
              <div>
                <Label className="mb-2 block">Admin (opsional)</Label>
                <select
                  className="w-full rounded-md border px-3 py-2"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                >
                  <option value="">Pilih Admin</option>
                  {staff
                    .filter((s) => s.jobRole === "ADMIN")
                    .map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div />
            )}
          </div>

          {/* Anamnesis & Catatan (hidden for Petshop) */}
          {!isPetshop && (
            <div className="grid gap-3 rounded-md border p-3">
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
              {!isPetshop && (
                <div>
                  <Label className="mb-2 block">Admin (opsional)</Label>
                  <select
                    className="w-full rounded-md border px-3 py-2"
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                  >
                    <option value="">Pilih Admin</option>
                    {staff
                      .filter((s) => s.jobRole === "ADMIN")
                      .map((s) => (
                        <option key={s.id} value={String(s.id)}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              {isGrooming ? (
                <div>
                  <Label className="mb-2 block">Groomer (opsional)</Label>
                  <select
                    className="w-full rounded-md border px-3 py-2"
                    value={groomerId}
                    onChange={(e) => setGroomerId(e.target.value)}
                  >
                    <option value="">Pilih Groomer</option>
                    {staff
                      .filter((s) => s.jobRole === "GROOMER")
                      .map((s) => (
                        <option key={s.id} value={String(s.id)}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>
              ) : null}
            </div>
          )}

          {/* Berat & Suhu (hidden for Petshop) */}
          {!isPetshop && (
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
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={`Catatan ${isPetshop ? "pemesanan" : "pemeriksaan"}`}
                />
              </div>
            </div>
          )}

          {/* Diagnosis & Prognosis (hidden for Petshop) */}
          {!isPetshop && (
            <div className="grid gap-3 rounded-md border p-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Label className="mb-2 block">Diagnosis</Label>
                  <div className="grid gap-2">
                    {diagnoses.map((d, i) => (
                      <div key={d.id} className="flex gap-2">
                        <Input
                          value={d.value}
                          onChange={(e) =>
                            setDiagnoses((prev) =>
                              prev.map((x, idx) => (idx === i ? { ...x, value: e.target.value } : x)),
                            )
                          }
                          placeholder="Masukkan diagnosis"
                        />
                        <Button
                          variant="outline"
                          onClick={() => setDiagnoses((prev) => prev.filter((_, idx) => idx !== i))}
                          disabled={diagnoses.length <= 1}
                        >
                          Hapus
                        </Button>
                      </div>
                    ))}
                    <div className="flex justify-end">
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setDiagnoses((prev) => [...prev, { id: Math.random().toString(36).slice(2), value: "" }])
                        }
                      >
                        Tambah Diagnosis
                      </Button>
                    </div>
                  </div>
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
          )}

          {/* Items + Sub-items */}
          <div className="grid gap-3 rounded-md border p-3">
            <div className="text-sm font-medium">Item</div>
            {items.map((it, i) => (
              <div key={it.id} className="grid gap-2 rounded-md border p-2">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-6">
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
                <div className="grid gap-2">
                  {it.components.map((c, j) => {
                    const prod = productsList.find((x) => String(x.id) === c.productId);
                    const unitLabel = prod?.unitContentName ?? prod?.unit ?? "unit";
                    const displayUnit = isPetshop ? (prod?.unitContentName ?? unitLabel) : (prod?.unit ?? unitLabel);
                    return (
                      <div key={c.id} className="grid grid-cols-1 gap-2 md:grid-cols-4">
                        <select
                          className="rounded-md border px-3 py-2"
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
                        <div className="relative md:col-span-2">
                          <Input
                            className="pr-16"
                            placeholder={`Qty (${it.components.length > 1 ? `dalam ${displayUnit}` : `dalam ${displayUnit}`})`}
                            value={c.quantity}
                            onChange={(e) => setComponent(i, j, "quantity", e.target.value)}
                          />
                          <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs">
                            {displayUnit}
                          </span>
                        </div>
                        <div className="text-muted-foreground flex items-end text-xs">
                          {(() => {
                            const denom = prod?.unitContentAmount ? Number(prod.unitContentAmount) : undefined;
                            const q = Number(c.quantity || 0);
                            if (!q || !prod) return null;
                            if (denom && denom > 0) {
                              if (isPetshop) {
                                // Input interpreted as inner, show primary (unit)
                                const primary = q / denom;
                                return (
                                  <span>
                                    ≈ {primary.toFixed(4)} {prod.unit ?? "unit"}
                                  </span>
                                );
                              }
                              // Non-petshop: input interpreted as primary, show inner
                              const inner = q * denom;
                              return (
                                <span>
                                  ≈ {inner.toFixed(2)} {prod.unitContentName ?? "inner"}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" onClick={() => removeComponent(i, j)}>
                            Hapus
                          </Button>
                          {j === it.components.length - 1 && (
                            <Button variant="secondary" onClick={() => addComponent(i)}>
                              Tambah Sub-item
                            </Button>
                          )}
                        </div>
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

          {/* Quick Mix removed */}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tambah {isPetshop ? "Pemesanan" : "Pemeriksaan"}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {/* Paravet, Dokter, Admin, Groomer */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {!isPetshop ? (
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
          ) : null}
          {!isPetshop ? (
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
          ) : null}
          <div>
            <Label className="mb-2 block">Admin (opsional)</Label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
            >
              <option value="">Pilih Admin</option>
              {staff
                .filter((s) => s.jobRole === "ADMIN")
                .map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
          {isGrooming ? (
            <div>
              <Label className="mb-2 block">Groomer (opsional)</Label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={groomerId}
                onChange={(e) => setGroomerId(e.target.value)}
              >
                <option value="">Pilih Groomer</option>
                {staff
                  .filter((s) => s.jobRole === "GROOMER")
                  .map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
          ) : null}
        </div>

        {/* Anamnesis & Catatan */}
        <div className="grid gap-3 rounded-md border p-3">
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
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={`Catatan ${isPetshop ? "pemesanan" : "pemeriksaan"}`}
            />
          </div>
        </div>

        {/* Diagnosis & Prognosis */}
        <div className="grid gap-3 rounded-md border p-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label className="mb-2 block">Diagnosis</Label>
              <div className="grid gap-2">
                {diagnoses.map((d, i) => (
                  <div key={d.id} className="flex gap-2">
                    <Input
                      value={d.value}
                      onChange={(e) =>
                        setDiagnoses((prev) => prev.map((x, idx) => (idx === i ? { ...x, value: e.target.value } : x)))
                      }
                      placeholder="Masukkan diagnosis"
                    />
                    <Button
                      variant="outline"
                      onClick={() => setDiagnoses((prev) => prev.filter((_, idx) => idx !== i))}
                      disabled={diagnoses.length <= 1}
                    >
                      Hapus
                    </Button>
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setDiagnoses((prev) => [...prev, { id: Math.random().toString(36).slice(2), value: "" }])
                    }
                  >
                    Tambah Diagnosis
                  </Button>
                </div>
              </div>
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

        {/* Items + Sub-items */}
        <div className="w-full">
          <div className="grid gap-3 rounded-md border p-3">
            <div className="text-sm font-medium">Item</div>
            <div className="text-muted-foreground text-xs">Perubahan item tersimpan setelah klik Simpan.</div>
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
                    <Button variant="outline" onClick={() => removeItem(i)}>
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

        <div className="flex items-center justify-end gap-2">
          {!externalControls && isPerDay ? <ProceedToDepositButton bookingId={bookingId} /> : null}
          <Button onClick={() => submit()}>Simpan {isPetshop ? "Pemesanan" : "Pemeriksaan"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
