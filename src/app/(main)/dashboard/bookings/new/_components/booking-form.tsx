"use client";
/* eslint-disable import/order */

import * as React from "react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Service = { id: number; name: string };
type Owner = { id: number; name: string };
type Pet = { id: number; name: string };

export function BookingForm({ services, owners }: { services: Service[]; owners: Owner[] }) {
  const router = useRouter();
  const [ownerId, setOwnerId] = React.useState<string>("");
  const [pets, setPets] = React.useState<Pet[]>([]);
  const [selectedPetIds, setSelectedPetIds] = React.useState<number[]>([]);
  const [serviceId, setServiceId] = React.useState<string>("");
  const [serviceTypes, setServiceTypes] = React.useState<
    Array<{ id: number; name: string; pricePerDay?: string | null }>
  >([]);
  const [serviceTypeId, setServiceTypeId] = React.useState<string>("");
  const [startDate, setStartDate] = React.useState<string>("");

  React.useEffect(() => {
    if (!ownerId) {
      setPets([]);
      setSelectedPetIds([]);
      return;
    }
    const ctrl = new AbortController();
    fetch(`/api/owners/${ownerId}`, { cache: "no-store", signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const list: Pet[] = data?.pets?.map((p: { id: number; name: string }) => ({ id: p.id, name: p.name })) ?? [];
        setPets(list);
        setSelectedPetIds([]);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [ownerId]);

  React.useEffect(() => {
    if (!serviceId) {
      setServiceTypes([]);
      setServiceTypeId("");
      return;
    }
    const ctrl = new AbortController();
    fetch(`/api/service-types?serviceId=${serviceId}`, { cache: "no-store", signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) =>
        setServiceTypes(
          Array.isArray(data)
            ? data.map((t: { id: number; name: string; pricePerDay?: string | null }) => ({
                id: t.id,
                name: t.name,
                pricePerDay: t.pricePerDay ?? null,
              }))
            : [],
        ),
      )
      .catch(() => {});
    return () => ctrl.abort();
  }, [serviceId]);

  const selectedType = React.useMemo(
    () => serviceTypes.find((t) => String(t.id) === serviceTypeId) ?? null,
    [serviceTypes, serviceTypeId],
  );
  const requiresDates = !!selectedType?.pricePerDay;
  React.useEffect(() => {
    // Reset tanggal ketika ganti tipe
    setStartDate("");
  }, [serviceTypeId]);

  function togglePet(id: number) {
    setSelectedPetIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  async function submit() {
    if (!ownerId || !serviceTypeId || selectedPetIds.length === 0) {
      toast.error("Lengkapi owner, service type, dan minimal satu pet");
      return;
    }
    if (requiresDates && !startDate) {
      toast.error("Tanggal booking wajib untuk tipe per-hari");
      return;
    }
    const body = {
      ownerId: Number(ownerId),
      serviceTypeId: Number(serviceTypeId),
      petIds: selectedPetIds,
      startDate: requiresDates ? startDate || undefined : undefined,
    };
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      toast.error("Gagal membuat booking");
      return;
    }
    await res.json();
    toast.success("Booking berhasil dibuat");
    router.push("/dashboard/bookings");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Booking</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label className="mb-2 block">Owner</Label>
            <Select value={ownerId} onValueChange={setOwnerId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih owner" />
              </SelectTrigger>
              <SelectContent>
                {owners.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">Service</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">Service Type</Label>
            <Select value={serviceTypeId} onValueChange={setServiceTypeId} disabled={!serviceId}>
              <SelectTrigger>
                <SelectValue placeholder={serviceId ? "Pilih service type" : "Pilih service dulu"} />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">Tanggal Booking</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Pilih Pets</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {pets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePet(p.id)}
                className={`rounded-md border px-3 py-2 text-left text-sm ${selectedPetIds.includes(p.id) ? "border-primary bg-primary/10" : "hover:bg-muted"}`}
              >
                {p.name}
              </button>
            ))}
            {!ownerId && <div className="text-muted-foreground text-xs">Pilih owner untuk memuat pets</div>}
            {ownerId && pets.length === 0 && (
              <div className="text-muted-foreground text-xs">Owner belum memiliki pet</div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={submit} disabled={!ownerId || !serviceTypeId || selectedPetIds.length === 0}>
            Buat Booking
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
