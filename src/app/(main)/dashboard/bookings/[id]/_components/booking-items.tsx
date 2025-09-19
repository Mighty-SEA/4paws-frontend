"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type BookingItem = {
  id: number;
  role: "PRIMARY" | "ADDON";
  quantity: number;
  startDate?: string | null;
  endDate?: string | null;
  unitPrice?: string | number | null;
  serviceType: {
    id: number;
    name: string;
    service?: { name?: string } | null;
    price?: string;
    pricePerDay?: string | null;
  };
};

export function BookingItems({ bookingId, items }: { bookingId: number; items: BookingItem[] }) {
  const router = useRouter();
  const [typeOpen, setTypeOpen] = React.useState(false);
  const [allTypes, setAllTypes] = React.useState<Array<{ id: number; name: string; pricePerDay?: string | null }>>([]);
  const [serviceTypeId, setServiceTypeId] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const res = await fetch("/api/service-types", { cache: "no-store" });
      const data = await res.json().catch(() => []);
      setAllTypes(
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
    () => allTypes.find((t) => String(t.id) === serviceTypeId) ?? null,
    [allTypes, serviceTypeId],
  );

  async function addItem() {
    if (!serviceTypeId) return;
    setLoading(true);
    try {
      const body: any = { serviceTypeId: Number(serviceTypeId) };
      const res = await fetch(`/api/bookings/${bookingId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        toast.error("Gagal menambah addon");
        return;
      }
      toast.success("Addon ditambahkan");
      setServiceTypeId("");
      setStartDate("");
      setEndDate("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(itemId: number) {
    const res = await fetch(`/api/bookings/${bookingId}/items?itemId=${itemId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Gagal menghapus addon");
      return;
    }
    toast.success("Addon dihapus");
    router.refresh();
  }

  async function updateItem(
    it: BookingItem,
    patch: Partial<{ quantity: number; startDate?: string; endDate?: string }>,
  ) {
    const params = new URLSearchParams({ itemId: String(it.id) }).toString();
    const res = await fetch(`/api/bookings/${bookingId}/items?${params}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      toast.error("Gagal menyimpan perubahan addon");
      return;
    }
    toast.success("Perubahan addon disimpan");
    router.refresh();
  }

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="grid gap-1">
          <Label>Service Type</Label>
          <Popover open={typeOpen} onOpenChange={setTypeOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between">
                {serviceTypeId
                  ? (allTypes.find((t) => String(t.id) === serviceTypeId)?.name ?? "Pilih service type")
                  : "Pilih service type"}
                <ChevronsUpDown className="ml-2 size-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
              <Command>
                <CommandInput placeholder="Cari service type..." />
                <CommandList>
                  <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                  <CommandGroup>
                    {allTypes.map((t) => (
                      <CommandItem
                        key={t.id}
                        value={t.name}
                        onSelect={() => {
                          setServiceTypeId(String(t.id));
                          setTypeOpen(false);
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

        <div className="flex items-end justify-end">
          <Button onClick={addItem} disabled={!serviceTypeId || loading}>
            {loading ? "Menambah..." : "Tambah Addon"}
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <div className="grid grid-cols-12 gap-2 p-2 text-xs font-medium">
          <div className="col-span-8">Service Type</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2 text-right">Aksi</div>
        </div>
        <div className="grid gap-1 p-2">
          {items?.length ? (
            items.map((it) => (
              <div key={it.id} className="grid grid-cols-12 items-center gap-2 text-sm">
                <div className="col-span-8">
                  <div className="font-medium">{it.serviceType?.name}</div>
                  <div className="text-muted-foreground text-xs">{it.serviceType?.service?.name ?? "-"}</div>
                </div>
                <div className="col-span-2">
                  <span className="rounded border px-2 py-0.5 text-xs">{it.role}</span>
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => removeItem(it.id)}>
                    Hapus
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-muted-foreground text-sm">Belum ada addon</div>
          )}
        </div>
      </div>
    </div>
  );
}
