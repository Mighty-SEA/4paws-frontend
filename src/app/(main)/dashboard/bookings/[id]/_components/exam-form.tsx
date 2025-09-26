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
  };
}) {
  const router = useRouter();
  const [weight, setWeight] = React.useState("");
  const [temperature, setTemperature] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [chiefComplaint, setChiefComplaint] = React.useState("");
  const [additionalNotes, setAdditionalNotes] = React.useState("");
  const [diagnoses, setDiagnoses] = React.useState<Array<{ id: string; value: string }>>([
    { id: Math.random().toString(36).slice(2), value: "" },
  ]);
  const [prognosis, setPrognosis] = React.useState("");
  const [products, setProducts] = React.useState<Array<{ id: string; productName: string; quantity: string }>>([
    { id: Math.random().toString(36).slice(2), productName: "", quantity: "" },
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
  const [isGrooming, setIsGrooming] = React.useState(false);

  React.useEffect(() => {
    (async () => {
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
      // detect grooming service type (exact based on seeder: Service 'Grooming')
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
          const isGroom = svcName === "grooming" || typeName === "grooming" || typeName.startsWith("grooming ");
          setIsGrooming(isGroom);
        } else {
          setIsGrooming(false);
        }
      } catch {
        setIsGrooming(false);
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

  // Quick Mix handlers removed

  async function submit(options?: { silent?: boolean }) {
    const body = {
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
      products: products
        .filter((p) => p.productName && p.quantity)
        .map((p) => ({ productName: p.productName, quantity: p.quantity })),
      adminId: adminId ? Number(adminId) : undefined,
      groomerId: groomerId ? Number(groomerId) : undefined,
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

    await res.json().catch(() => null);

    toast.success("Pemeriksaan tersimpan");
    setWeight("");
    setTemperature("");
    setNotes("");
    setChiefComplaint("");
    setAdditionalNotes("");
    setDiagnoses([{ id: Math.random().toString(36).slice(2), value: "" }]);
    setPrognosis("");
    setProducts([{ id: Math.random().toString(36).slice(2), productName: "", quantity: "" }]);
    // quick mix removed
    router.refresh();
    return true;
  }

  React.useEffect(() => {
    if (externalControls && register) {
      register(() => submit());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalControls, register, weight, temperature, notes, products, diagnoses]);

  if (externalControls) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tambah Pemeriksaan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {/* Paravet, Dokter, Admin, Groomer (opsional) */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
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

          <ExamProducts
            products={products}
            productsList={productsList}
            setProduct={setProduct}
            addProduct={addProduct}
            removeProduct={removeProduct}
          />

          {/* Quick Mix removed */}
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
        {/* Paravet, Dokter, Admin, Groomer */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
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
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan pemeriksaan" />
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

        <ExamProducts
          products={products}
          productsList={productsList}
          setProduct={setProduct}
          addProduct={addProduct}
          removeProduct={removeProduct}
        />

        {/* Quick Mix removed */}

        {mode === "perDay" ? (
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
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
                  // set WAITING_TO_DEPOSIT so list shows Deposit action
                  await fetch(`/api/bookings/${bookingId}`, { method: "PATCH" });
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
