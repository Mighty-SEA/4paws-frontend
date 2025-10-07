"use client";
/* eslint-disable import/order */

import * as React from "react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { revalidateBookings } from "../../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { NewOwnerInline } from "@/app/(main)/dashboard/owners/_components/new-owner-inline";
import { AddPetForm } from "@/app/(main)/dashboard/owners/[ownerId]/_components/add-pet-form";

type Service = { id: number; name: string };
type Owner = { id: number; name: string; phone?: string | null; _count?: { pets: number } };
type Pet = { id: number; name: string };

function OwnerLabel({ o, ownerPets }: { o: Owner; ownerPets?: Pet[] }) {
  const phone = o.phone ?? "-";

  // Calculate real pet count immediately from provided data or fallback to _count
  const realPetCount = React.useMemo(() => {
    if (ownerPets) {
      return ownerPets.filter((p) => String(p?.name ?? "").toLowerCase() !== "petshop").length;
    }
    // Fallback to _count if no pets data provided
    return (o as any)["_count"]?.pets ?? 0;
  }, [ownerPets, o]);

  return (
    <div className="grid w-full grid-cols-12 items-center gap-2">
      <span className="col-span-6 truncate">{o.name}</span>
      <span className="text-muted-foreground col-span-4 truncate">{phone}</span>
      <span className="col-span-2 text-right">{realPetCount} pet</span>
    </div>
  );
}

export function BookingForm({
  services,
  owners,
  onSuccess,
}: {
  services: Service[];
  owners: Owner[];
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [ownerId, setOwnerId] = React.useState<string>("");
  const [ownerOpen, setOwnerOpen] = React.useState(false);
  const [ownerCreateOpen, setOwnerCreateOpen] = React.useState(false);
  const [ownerOptions, setOwnerOptions] = React.useState<Owner[]>(owners);
  const [petCreateOpen, setPetCreateOpen] = React.useState(false);
  const [pets, setPets] = React.useState<Pet[]>([]);
  const [selectedPetIds, setSelectedPetIds] = React.useState<number[]>([]);
  const [allOwnerPets, setAllOwnerPets] = React.useState<Map<number, Pet[]>>(new Map());
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
        const list: Pet[] =
          data?.pets
            ?.filter((p: { id: number; name: string }) => String(p?.name ?? "").toLowerCase() !== "petshop")
            .map((p: { id: number; name: string }) => ({ id: p.id, name: p.name })) ?? [];
        setPets(list);
        setSelectedPetIds([]);
        // Update the pets map for this owner
        setAllOwnerPets((prev) => new Map(prev).set(Number(ownerId), list));
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

  // Removed heavy load all owner pets on mount
  // Pets will be loaded on-demand when owner is selected (see useEffect with ownerId dependency)

  const selectedType = React.useMemo(
    () => serviceTypes.find((t) => String(t.id) === serviceTypeId) ?? null,
    [serviceTypes, serviceTypeId],
  );
  const requiresDates = !!selectedType?.pricePerDay;
  const isPetshop = React.useMemo(() => {
    const name = selectedType?.name?.toLowerCase() ?? "";
    return name === "petshop";
  }, [selectedType]);
  function resetForm() {
    setOwnerId("");
    setOwnerOpen(false);
    setPets([]);
    setSelectedPetIds([]);
    setServiceId("");
    setServiceTypes([]);
    setServiceTypeId("");
    setServiceTypeOpen(false);
    setStartDate("");
    setAddonServiceTypeId("");
    setAddons([]);
    setTypeOpen(false);
  }
  React.useEffect(() => {
    // Reset tanggal ketika ganti tipe
    setStartDate("");
  }, [serviceTypeId]);

  function togglePet(id: number) {
    setSelectedPetIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  async function submit() {
    if (!ownerId || !serviceTypeId || (!isPetshop && selectedPetIds.length === 0)) {
      toast.error(isPetshop ? "Lengkapi owner dan service type" : "Lengkapi owner, service type, dan minimal satu pet");
      return;
    }
    if (requiresDates && !startDate) {
      toast.error("Tanggal booking wajib untuk tipe per-hari");
      return;
    }
    const isoStart = startDate ? new Date(startDate).toISOString() : undefined;
    const body = {
      ownerId: Number(ownerId),
      serviceTypeId: Number(serviceTypeId),
      petIds: isPetshop ? [] : selectedPetIds,
      startDate: requiresDates ? isoStart : undefined,
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
    // Invalidate bookings cache and refresh
    await revalidateBookings();
    resetForm();
    router.refresh();
    // Call onSuccess callback if provided (for wrapper to close form)
    if (onSuccess) {
      onSuccess();
    }
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label className="mb-2 block">Owner</Label>
                <Popover open={ownerOpen} onOpenChange={setOwnerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full min-w-[220px] justify-between">
                      {ownerId
                        ? (() => {
                            const o = ownerOptions.find((x) => String(x.id) === ownerId);
                            return o ? o.name : "Pilih owner";
                          })()
                        : "Pilih owner"}
                      <ChevronsUpDown className="ml-2 size-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Cari owner..." />
                      <CommandList>
                        <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {ownerOptions.map((o) => (
                            <CommandItem
                              key={o.id}
                              value={`${o.name} ${o.phone ?? ""}`}
                              onSelect={() => {
                                setOwnerId(String(o.id));
                                setOwnerOpen(false);
                              }}
                            >
                              <OwnerLabel o={o} ownerPets={allOwnerPets.get(o.id)} />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                      <div className="border-t p-2">
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-primary hover:bg-primary/10 w-full justify-start gap-2"
                          onClick={() => {
                            setOwnerOpen(false);
                            setOwnerCreateOpen(true);
                          }}
                        >
                          <Plus className="size-4" /> Tambah owner baru
                        </Button>
                      </div>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Dialog open={ownerCreateOpen} onOpenChange={setOwnerCreateOpen}>
                  <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                      <DialogTitle>Tambah Owner Baru</DialogTitle>
                      <DialogDescription>
                        Isi data pemilik, kemudian simpan untuk langsung memilihnya.
                      </DialogDescription>
                    </DialogHeader>
                    <NewOwnerInline
                      stacked
                      submitLabel="Simpan"
                      onCreated={(created) => {
                        (async () => {
                          try {
                            // Jika API mengembalikan owner, gunakan langsung
                            if (created?.id) {
                              setOwnerOptions((prev) => {
                                const exists = prev.some((p) => p.id === created.id);
                                return exists
                                  ? prev
                                  : [...prev, { id: created.id, name: created.name, phone: created.phone } as Owner];
                              });
                              setOwnerId(String(created.id));
                              setOwnerCreateOpen(false);
                              return;
                            }
                            // Fallback: reload list
                            const res = await fetch(`/api/owners?page=1&pageSize=10`, { cache: "no-store" });
                            const data = await res.json().catch(() => ({ items: [] }));
                            const items = Array.isArray(data?.items) ? data.items : [];
                            setOwnerOptions(items);
                            if (items.length) {
                              const newest = items[0];
                              if (newest?.id) setOwnerId(String(newest.id));
                              // Load pets for the new owner
                              try {
                                const petRes = await fetch(`/api/owners/${newest.id}`, { cache: "no-store" });
                                const petData = await petRes.json().catch(() => null);
                                const pets = Array.isArray(petData?.pets)
                                  ? petData.pets
                                      .filter(
                                        (p: { name?: string }) => String(p?.name ?? "").toLowerCase() !== "petshop",
                                      )
                                      .map((p: { id: number; name: string }) => ({ id: p.id, name: p.name }))
                                  : [];
                                setAllOwnerPets((prev) => new Map(prev).set(newest.id, pets));
                              } catch {
                                // Ignore errors
                              }
                            }
                          } catch (_err) {
                            /* noop */
                            return;
                          }
                          setOwnerCreateOpen(false);
                        })();
                      }}
                    />
                  </DialogContent>
                </Dialog>
                <Dialog open={petCreateOpen} onOpenChange={setPetCreateOpen}>
                  <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                      <DialogTitle>Tambah Pet</DialogTitle>
                      <DialogDescription>Tambah hewan milik owner terpilih.</DialogDescription>
                    </DialogHeader>
                    {ownerId ? (
                      <AddPetForm
                        ownerId={Number(ownerId)}
                        stacked
                        submitLabel="Simpan"
                        onCreated={(created) => {
                          (async () => {
                            try {
                              const res = await fetch(`/api/owners/${ownerId}`, { cache: "no-store" });
                              const data = await res.json().catch(() => null);
                              const list: Pet[] = Array.isArray(data?.pets)
                                ? data.pets
                                    .filter(
                                      (p: { id: number; name: string }) =>
                                        String(p?.name ?? "").toLowerCase() !== "petshop",
                                    )
                                    .map((p: { id: number; name: string }) => ({ id: p.id, name: p.name }))
                                : [];
                              setPets(list);
                              // Update the pets map for this owner
                              setAllOwnerPets((prev) => new Map(prev).set(Number(ownerId), list));
                              if (created?.id) {
                                setSelectedPetIds((prev) => (prev.includes(created.id) ? prev : [...prev, created.id]));
                              }
                            } catch (_err) {
                              /* noop */
                              return;
                            }
                            setPetCreateOpen(false);
                          })();
                        }}
                      />
                    ) : null}
                  </DialogContent>
                </Dialog>
              </div>
              <div>
                <Label className="mb-2 block">Service</Label>
                <Select value={serviceId} onValueChange={setServiceId}>
                  <SelectTrigger className="w-full min-w-[220px]">
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
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full min-w-[220px] justify-between"
                      disabled={!serviceId}
                    >
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
                <Label className="mb-2 block">Tanggal & Jam Booking</Label>
                <Input
                  className="w-full min-w-[220px]"
                  type="datetime-local"
                  step="60"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            {!isPetshop && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Pilih Pets</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!ownerId) {
                        toast.error("Pilih owner dulu");
                        return;
                      }
                      setPetCreateOpen(true);
                    }}
                  >
                    <Plus className="mr-1 size-4" /> Tambah Pet
                  </Button>
                </div>
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
            )}

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
              <Button
                onClick={submit}
                disabled={!ownerId || !serviceTypeId || (!isPetshop && selectedPetIds.length === 0)}
              >
                Buat Booking
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
