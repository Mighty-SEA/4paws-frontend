"use client";
/* eslint-disable import/order */

import * as React from "react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Check, ChevronsUpDown } from "lucide-react";

type Service = { id: number; name: string };
type Owner = { id: number; name: string };
type Pet = { id: number; name: string };

export function BookingForm({ services, owners }: { services: Service[]; owners: Owner[] }) {
  const router = useRouter();
  const [ownerId, setOwnerId] = React.useState<string>("");
  const [ownerOpen, setOwnerOpen] = React.useState(false);
  const [pets, setPets] = React.useState<Pet[]>([]);
  const [selectedPetIds, setSelectedPetIds] = React.useState<number[]>([]);
  const [serviceId, setServiceId] = React.useState<string>("");
  const [serviceTypes, setServiceTypes] = React.useState<
    Array<{ id: number; name: string; pricePerDay?: string | null }>
  >([]);
  const [serviceTypeId, setServiceTypeId] = React.useState<string>("");
  const [serviceTypeOpen, setServiceTypeOpen] = React.useState(false);
  const [startDate, setStartDate] = React.useState<string>("");
  const [open, setOpen] = React.useState(true);

  // Addon builder (opsional)
  const [typeOpen, setTypeOpen] = React.useState(false);
  const [allAddonTypes, setAllAddonTypes] = React.useState<
    Array<{ id: number; name: string; pricePerDay?: string | null }>
  >([]);
  const [addonServiceTypeId, setAddonServiceTypeId] = React.useState("");
  const [addons, setAddons] = React.useState<Array<{ serviceTypeId: number }>>([]);

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

  React.useEffect(() => {
    (async () => {
      const res = await fetch(`/api/service-types`, { cache: "no-store" });
      const data = await res.json().catch(() => []);
      setAllAddonTypes(
        Array.isArray(data)
          ? data.map((t: { id: number; name: string; pricePerDay?: string | null }) => ({
              id: t.id,
              name: t.name,
              pricePerDay: t.pricePerDay ?? null,
            }))
          : [],
      );
    })();
  }, []);

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
    const created = await res.json();
    // Simpan addon jika ada
    if (created?.id && addons.length) {
      await Promise.all(
        addons.map((a) =>
          fetch(`/api/bookings/${created.id}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ serviceTypeId: a.serviceTypeId }),
          }),
        ),
      );
    }
    toast.success("Booking berhasil dibuat");
    // Tetap di list bookings agar alur sesuai permintaan
    router.push(`/dashboard/bookings`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Booking</CardTitle>
        <CardAction>
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                {open ? "Sembunyikan" : "Tampilkan"}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </CardAction>
      </CardHeader>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleContent>
          <CardContent className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="mb-2 block">Owner</Label>
                <Popover open={ownerOpen} onOpenChange={setOwnerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between">
                      {ownerId ? (owners.find((o) => String(o.id) === ownerId)?.name ?? "Pilih owner") : "Pilih owner"}
                      <ChevronsUpDown className="ml-2 size-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Cari owner..." />
                      <CommandList>
                        <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {owners.map((o) => (
                            <CommandItem
                              key={o.id}
                              value={o.name}
                              onSelect={() => {
                                setOwnerId(String(o.id));
                                setOwnerOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 size-4 ${String(o.id) === ownerId ? "opacity-100" : "opacity-0"}`}
                              />
                              {o.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                <Popover open={serviceTypeOpen} onOpenChange={setServiceTypeOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between" disabled={!serviceId}>
                      {serviceTypeId
                        ? (serviceTypes.find((t) => String(t.id) === serviceTypeId)?.name ?? "Pilih service type")
                        : serviceId
                          ? "Pilih service type"
                          : "Pilih service dulu"}
                      <ChevronsUpDown className="ml-2 size-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Cari service type..." />
                      <CommandList>
                        <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {serviceTypes.map((t) => (
                            <CommandItem
                              key={t.id}
                              value={t.name}
                              onSelect={() => {
                                setServiceTypeId(String(t.id));
                                setServiceTypeOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 size-4 ${String(t.id) === serviceTypeId ? "opacity-100" : "opacity-0"}`}
                              />
                              {t.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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

            {/* Addon (opsional) */}
            <div className="grid gap-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="grid gap-1">
                  <Label>Addon</Label>
                  <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between">
                        {addonServiceTypeId
                          ? (allAddonTypes.find((t) => String(t.id) === addonServiceTypeId)?.name ?? "Pilih addon")
                          : "Pilih addon"}
                        <ChevronsUpDown className="ml-2 size-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                      <Command>
                        <CommandInput placeholder="Cari addon..." />
                        <CommandList>
                          <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {allAddonTypes.map((t) => (
                              <CommandItem
                                key={t.id}
                                value={t.name}
                                onSelect={() => {
                                  setAddonServiceTypeId(String(t.id));
                                  setTypeOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 size-4 ${String(t.id) === addonServiceTypeId ? "opacity-100" : "opacity-0"}`}
                                />
                                {t.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-end justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!addonServiceTypeId) return;
                      setAddons((prev) => [
                        ...prev,
                        {
                          serviceTypeId: Number(addonServiceTypeId),
                        },
                      ]);
                      setAddonServiceTypeId("");
                    }}
                  >
                    Tambah Addon
                  </Button>
                </div>
              </div>
              <div className="rounded-md border">
                <div className="grid grid-cols-12 gap-2 p-2 text-xs font-medium">
                  <div className="col-span-12">Addon</div>
                </div>
                <div className="grid gap-1 p-2">
                  {addons.length ? (
                    addons.map((a, idx) => (
                      <div key={`${a.serviceTypeId}-${idx}`} className="grid grid-cols-12 items-center gap-2 text-sm">
                        <div className="col-span-12">
                          {allAddonTypes.find((t) => t.id === a.serviceTypeId)?.name ?? `#${a.serviceTypeId}`}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground text-sm">Belum ada addon</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={submit} disabled={!ownerId || !serviceTypeId || selectedPetIds.length === 0}>
                Buat Booking
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
