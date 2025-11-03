"use client";
import * as React from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMixPriceSuggestion, loadMixPriceDefaults, rememberMixPrice } from "@/lib/mix-price-defaults";

import { revalidateBookingDetail } from "../actions";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";

function MixProductSelect({
  products,
  value,
  onChange,
}: {
  products: Array<{ id: number; name: string }>;
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const selectedName = React.useMemo(() => {
    const found = products.find((p) => String(p.id) === value);
    return found ? found.name : "Pilih Produk";
  }, [products, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between">
          {selectedName}
          <ChevronsUpDown className="ml-2 size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Cari produk..." />
          <CommandList>
            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {products.map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.name}
                  onSelect={() => {
                    onChange(String(p.id));
                    setOpen(false);
                  }}
                >
                  <Check className={`mr-2 size-4 ${String(p.id) === value ? "opacity-100" : "opacity-0"}`} />
                  {p.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function StandaloneItems({ bookingId, bookingPetId }: { bookingId: number; bookingPetId: number }) {
  const router = useRouter();
  const [products, setProducts] = React.useState<
    Array<{ id: number; name: string; unit?: string; unitContentAmount?: number; unitContentName?: string }>
  >([]);
  const [hydrating, setHydrating] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  type ItemComponent = { id: string; productId: string; quantity: string };
  type ItemGroup = { id: string; label?: string; price?: string; components: ItemComponent[]; autoLabel?: boolean };
  const [items, setItems] = React.useState<ItemGroup[]>([
    {
      id: Math.random().toString(36).slice(2),
      label: "",
      price: "",
      components: [{ id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
      autoLabel: true,
    },
  ]);

  React.useEffect(() => {
    void loadMixPriceDefaults();
    (async () => {
      try {
        // Fetch products and booking concurrently
        const [resProd, resBooking] = await Promise.all([
          fetch(`/api/products`, { cache: "no-store" }),
          fetch(`/api/bookings/${bookingId}`, { cache: "no-store" }),
        ]);
        const prodData = await resProd.json().catch(() => []);
        const booking = await resBooking.json().catch(() => ({}));
        const normalizedProducts: Array<{
          id: number;
          name: string;
          unit?: string;
          unitContentAmount?: number;
          unitContentName?: string;
        }> = Array.isArray(prodData)
          ? prodData.map((p: any) => ({
              id: p.id,
              name: p.name,
              unit: p.unit,
              unitContentAmount: p.unitContentAmount,
              unitContentName: p.unitContentName,
            }))
          : [];
        setProducts(normalizedProducts);

        const bp = Array.isArray(booking?.pets)
          ? booking.pets.find((x: any) => String(x.id) === String(bookingPetId))
          : null;
        const next: ItemGroup[] = [];
        if (bp) {
          // Map standalone mixes (no visitId and no examinationId)
          const standaloneMix = Array.isArray(bp?.mixUsages)
            ? bp.mixUsages.filter((mu: any) => !mu?.visitId && !mu?.examinationId)
            : [];
          for (const mu of standaloneMix) {
            const mix = mu?.mixProduct;
            const comps = Array.isArray(mix?.components)
              ? mix.components.map((c: any) => ({
                  id: Math.random().toString(36).slice(2),
                  productId: String(c.productId),
                  quantity: String(c.quantityBase ?? ""),
                }))
              : [];
            if (!comps.length) continue;
            if (comps.length) {
              let resolvedLabel = String(mix?.name ?? "");
              const resolvedPrice = (() => {
                const candidate = mu?.unitPrice ?? mix?.price;
                if (candidate != null) {
                  const candidateStr = String(candidate).trim();
                  if (candidateStr !== "") {
                    return candidateStr;
                  }
                }
                const suggestion = getMixPriceSuggestion(resolvedLabel);
                return suggestion != null ? String(suggestion) : "";
              })();
              let autoLabel = false;
              if (!resolvedLabel && comps[0]?.productId) {
                const firstName = normalizedProducts.find((p) => String(p.id) === String(comps[0]?.productId))?.name ?? "";
                resolvedLabel = firstName;
                autoLabel = true;
              }
              next.push({
                id: Math.random().toString(36).slice(2),
                label: resolvedLabel,
                price: resolvedPrice,
                components: comps,
                autoLabel,
              });
              if (resolvedLabel && resolvedPrice) {
                rememberMixPrice(resolvedLabel, resolvedPrice);
              }
            }
          }
          // Map standalone singles
          const singleUsages = Array.isArray(bp?.productUsages)
            ? bp.productUsages.filter((pu: any) => !pu?.visitId && !pu?.examinationId)
            : [];
          for (const pu of singleUsages) {
            const pid = String(normalizedProducts.find((p) => p.name === String(pu.productName ?? ""))?.id ?? "");
            next.push({
              id: Math.random().toString(36).slice(2),
              label: "",
              components: [
                { id: Math.random().toString(36).slice(2), productId: pid, quantity: String(pu.quantity ?? "") },
              ],
              autoLabel: true,
            });
          }
        }
        setItems(
          next.length
            ? next
            : [
                {
                  id: Math.random().toString(36).slice(2),
                  label: "",
                  price: "",
                  components: [{ id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
                  autoLabel: true,
                },
              ],
        );
      } finally {
        setHydrating(false);
      }
    })();
  }, [bookingId, bookingPetId]);

  const parsePriceValue = React.useCallback((value: string | undefined): number | null => {
    const digits = String(value ?? "").replace(/[^0-9]/g, "");
    if (!digits) return null;
    const numeric = Number(digits);
    return Number.isFinite(numeric) ? numeric : null;
  }, []);
  const FALLBACK_MIX_PRICE = "55000";
  const hasPriceValue = React.useCallback((value: string | undefined) => {
    return value != null && String(value).trim().length > 0;
  }, []);

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        label: "",
        price: "",
        components: [{ id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
        autoLabel: true,
      },
    ]);
  }

  function setItemLabel(index: number, value: string) {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it;
        const previousLabel = it.label ?? "";
        const previousSuggestion = getMixPriceSuggestion(previousLabel ?? "");
        const currentPriceNumeric = parsePriceValue(it.price);
        const usedPreviousSuggestion =
          previousSuggestion != null && currentPriceNumeric != null && currentPriceNumeric === previousSuggestion;
        const hadPriceBefore = hasPriceValue(it.price);

        const next: ItemGroup = { ...it, label: value, autoLabel: true };
        if (next.components.length > 1) {
          const suggestion = getMixPriceSuggestion(value);
          const shouldReplaceWithSuggestion = suggestion != null && (usedPreviousSuggestion || !hadPriceBefore);
          if (shouldReplaceWithSuggestion && suggestion != null) {
            next.price = String(suggestion);
          } else if (usedPreviousSuggestion && suggestion == null) {
            next.price = FALLBACK_MIX_PRICE;
          } else if (!usedPreviousSuggestion && !hadPriceBefore) {
            next.price = FALLBACK_MIX_PRICE;
          }
          if (next.label && next.price) {
            rememberMixPrice(next.label, next.price);
          }
        }
        return next;
      }),
    );
  }

  function setItemPrice(index: number, value: string) {
    const digitsOnly = String(value ?? "").replace(/[^0-9]/g, "");
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it;
        const next = { ...it, price: digitsOnly };
        if (next.components.length > 1 && next.label && digitsOnly) {
          rememberMixPrice(next.label, digitsOnly);
        }
        return next;
      }),
    );
  }

  function setComponent(itemIdx: number, compIdx: number, key: "productId" | "quantity", value: string) {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== itemIdx) return it;
        const updated = it.components.map((c, j) => (j === compIdx ? { ...c, [key]: value } : c));
        // Auto label suggestion from first product
        let updatedLabel = it.label ?? "";
        let updatedAutoLabel = true;
        if (key === "productId" && compIdx === 0) {
          const newFirstName = products.find((p) => String(p.id) === value)?.name ?? "";
          updatedLabel = newFirstName;
        }
        let updatedPrice = it.price ?? "";
        const previousLabel = it.label ?? "";
        const previousSuggestion = getMixPriceSuggestion(previousLabel ?? "");
        const currentPriceNumeric = parsePriceValue(it.price);
        const usedPreviousSuggestion =
          previousSuggestion != null && currentPriceNumeric != null && currentPriceNumeric === previousSuggestion;
        const hadPriceBefore = hasPriceValue(it.price);
        const isMix = updated.length > 1;
        const labelChanged = updatedLabel !== (it.label ?? "");
        const becameMix = isMix && it.components.length <= 1;
        if (isMix && (labelChanged || becameMix)) {
          const suggestion = getMixPriceSuggestion(updatedLabel);
          const allowAuto = (updatedAutoLabel ?? true) && !hadPriceBefore;
          const shouldReplaceWithSuggestion = suggestion != null && (usedPreviousSuggestion || allowAuto);
          if (shouldReplaceWithSuggestion && suggestion != null) {
            updatedPrice = String(suggestion);
          } else if (usedPreviousSuggestion && suggestion == null) {
            updatedPrice = FALLBACK_MIX_PRICE;
          } else if (!usedPreviousSuggestion && allowAuto) {
            updatedPrice = FALLBACK_MIX_PRICE;
          }
        }
        const next: ItemGroup = {
          ...it,
          components: updated,
          label: updatedLabel,
          price: updatedPrice,
          autoLabel: updatedAutoLabel,
        };
        if (isMix && next.label && next.price) {
          rememberMixPrice(next.label, next.price);
        }
        return next;
      }),
    );
  }

  function addComponentRow(itemIdx: number) {
    setItems((prev) =>
      prev.map((it, i) =>
        i === itemIdx
          ? {
              ...it,
              components: [...it.components, { id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
              autoLabel: it.autoLabel,
              price:
                it.components.length + 1 > 1 && !hasPriceValue(it.price)
                  ? (() => {
                      const suggestion = getMixPriceSuggestion(it.label ?? "");
                      return suggestion != null ? String(suggestion) : FALLBACK_MIX_PRICE;
                    })()
                  : it.price ?? "",
            }
          : it,
      ),
    );
  }

  function removeComponentRow(itemIdx: number, compIdx: number) {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== itemIdx) return it;
        const next = it.components.filter((_, j) => j !== compIdx);
        return {
          ...it,
          components: next.length ? next : [{ id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
        };
      }),
    );
  }

  // Replace-all behavior like examination: send full buffer as singles + mixes
  async function saveAll() {
    const singles: Array<{ productId: number; quantity: string }> = [];
    const mixes: Array<{ label?: string; components: Array<{ productId: number; quantity: string }> }> = [];
    for (const it of items) {
      const comps = it.components.filter((c) => c.productId && c.quantity);
      if (!comps.length) continue;
      if (comps.length === 1) {
        singles.push({ productId: Number(comps[0].productId), quantity: comps[0].quantity });
      } else {
        mixes.push({
          label: it.label && it.label.trim().length ? it.label : undefined,
          // forward price if provided
          price: (it as any).price && String((it as any).price).trim().length ? (it as any).price : undefined,
          components: comps.map((c) => ({ productId: Number(c.productId), quantity: c.quantity })),
        } as any);
      }
    }
    setLoading(true);
    const res = await fetch(`/api/bookings/${bookingId}/pets/${bookingPetId}/standalone-items`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ singles, mixes }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Gagal menyimpan item tambahan");
      return;
    }
    toast.success("Item tambahan disimpan");
    // Invalidate cache and reload from server to reflect saved state
    await revalidateBookingDetail();
    router.refresh();
  }

  if (hydrating) {
    return <div className="text-muted-foreground text-xs">Memuat item…</div>;
  }

  return (
    <div className="grid gap-3">
      <div className="text-sm font-medium">Item</div>
      <div className="hidden rounded-md border p-2 text-xs font-medium md:grid md:grid-cols-[2fr_1fr_1fr_auto] md:gap-2">
        <div>Nama Item</div>
        <div>Harga Mix</div>
        <div></div>
        <div className="text-right">Hapus Item</div>
      </div>
      {items.map((it, i) => (
        <div key={it.id} className="grid gap-2 rounded-md border p-2">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-[2fr_1fr_1fr_auto]">
            <div>
              <Label className="mb-2 block">Nama Item (opsional)</Label>
              <Input
                value={it.label ?? ""}
                onChange={(e) => setItemLabel(i, e.target.value)}
                placeholder="Contoh: Obat Racik A"
              />
            </div>
            {it.components.length > 1 ? (
              <div>
                <Label className="mb-2 block">Harga Mix (Rp)</Label>
                <Input
                  value={(it.price ?? "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  onChange={(e) => setItemPrice(i, e.target.value)}
                  placeholder="Masukkan harga mix"
                  inputMode="decimal"
                />
              </div>
            ) : (
              <div />
            )}
            <div />
            <div className="flex items-end justify-end">
              <Button
                variant="outline"
                onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={items.length <= 1}
              >
                Hapus Item
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            {it.components.map((c, j) => {
              const prod = products.find((x) => String(x.id) === c.productId);
              const unitLabel = prod?.unitContentName ?? prod?.unit ?? "unit";
              const displayUnit = it.components.length > 1 ? unitLabel : prod?.unit ?? unitLabel;
              const isLast = j === it.components.length - 1;
              return (
                <div key={c.id} className="grid grid-cols-1 gap-2 md:grid-cols-[2fr_1fr_auto_auto]">
                  <MixProductSelect
                    products={products.map((p) => ({ id: p.id, name: p.name }))}
                    value={c.productId}
                    onChange={(val) => setComponent(i, j, "productId", val)}
                  />
                  <div className="relative">
                    <Input
                      className="w-full pr-16"
                      placeholder={`Qty (${displayUnit})`}
                      value={c.quantity}
                      onChange={(e) => setComponent(i, j, "quantity", e.target.value)}
                    />
                    <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs">
                      {displayUnit}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      onClick={() => removeComponentRow(i, j)}
                      disabled={it.components.length <= 1}
                    >
                      Hapus
                    </Button>
                  </div>
                  <div className="flex items-center">
                    {isLast ? (
                      <Button variant="secondary" onClick={() => addComponentRow(i)}>
                        Tambah Sub-item
                      </Button>
                    ) : (
                      <div className="invisible">
                        <Button variant="secondary">Tambah Sub-item</Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div className="flex justify-end">
        <Button variant="secondary" onClick={addItem} className="mr-2">
          Tambah Item
        </Button>
        <Button onClick={saveAll} disabled={loading}>
          Simpan
        </Button>
      </div>
    </div>
  );
}