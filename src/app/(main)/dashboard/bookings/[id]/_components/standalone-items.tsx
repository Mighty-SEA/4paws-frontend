"use client";
import * as React from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function StandaloneItems({ bookingId, bookingPetId }: { bookingId: number; bookingPetId: number }) {
  const router = useRouter();
  const [products, setProducts] = React.useState<
    Array<{ id: number; name: string; unit?: string; unitContentAmount?: number; unitContentName?: string }>
  >([]);
  const [hydrating, setHydrating] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  type ItemComponent = { id: string; productId: string };
  type ItemGroup = { id: string; label?: string; price?: string; components: ItemComponent[] };
  const [items, setItems] = React.useState<ItemGroup[]>([]);

  React.useEffect(() => {
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
          // Map standalone mixes (no visitId)
          const standaloneMix = Array.isArray(bp?.mixUsages) ? bp.mixUsages.filter((mu: any) => !mu?.visitId) : [];
          for (const mu of standaloneMix) {
            const mix = mu?.mixProduct;
            const comps = Array.isArray(mix?.components)
              ? mix.components.map((c: any) => ({
                  id: Math.random().toString(36).slice(2),
                  productId: String(c.productId),
                }))
              : [];
            if (!comps.length) continue;
            next.push({
              id: Math.random().toString(36).slice(2),
              label: String(mix?.name ?? ""),
              price: String(mu?.unitPrice ?? mix?.price ?? ""),
              components: comps,
            });
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
              components: [{ id: Math.random().toString(36).slice(2), productId: pid }],
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
                  components: [{ id: Math.random().toString(36).slice(2), productId: "" }],
                },
              ],
        );
      } finally {
        setHydrating(false);
      }
    })();
  }, [bookingId, bookingPetId]);

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        label: "",
        components: [{ id: Math.random().toString(36).slice(2), productId: "" }],
      },
    ]);
  }

  function setItemLabel(index: number, value: string) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, label: value } : it)));
  }

  function setItemPrice(index: number, value: string) {
    const digitsOnly = String(value ?? "").replace(/[^0-9]/g, "");
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, price: digitsOnly } : it)));
  }

  function setComponent(itemIdx: number, compIdx: number, productId: string) {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== itemIdx) return it;
        const updated = it.components.map((c, j) => (j === compIdx ? { ...c, productId } : c));
        // Auto label suggestion from first product
        let updatedLabel = it.label ?? "";
        if (compIdx === 0) {
          const newFirstName = products.find((p) => String(p.id) === productId)?.name ?? "";
          const labelIsEmpty = (updatedLabel ?? "").trim().length === 0;
          const firstWasSame =
            (updatedLabel ?? "") === (products.find((p) => String(p.id) === it.components[0]?.productId)?.name ?? "");
          if (labelIsEmpty || firstWasSame) updatedLabel = newFirstName;
        }
        return { ...it, components: updated, label: updatedLabel };
      }),
    );
  }

  function addComponentRow(itemIdx: number) {
    setItems((prev) =>
      prev.map((it, i) =>
        i === itemIdx
          ? { ...it, components: [...it.components, { id: Math.random().toString(36).slice(2), productId: "" }] }
          : it,
      ),
    );
  }

  function removeComponentRow(itemIdx: number, compIdx: number) {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== itemIdx) return it;
        const next = it.components.filter((_, j) => j !== compIdx);
        return { ...it, components: next.length ? next : [{ id: Math.random().toString(36).slice(2), productId: "" }] };
      }),
    );
  }

  // Replace-all behavior like examination: send full buffer as singles + mixes
  async function saveAll() {
    const singles: Array<{ productId: number; quantity: string }> = [];
    const mixes: Array<{ label?: string; components: Array<{ productId: number; quantity: string }> }> = [];
    for (const it of items) {
      const comps = it.components.filter((c) => c.productId);
      if (!comps.length) continue;
      if (comps.length === 1) {
        singles.push({ productId: Number(comps[0].productId), quantity: "1" });
      } else {
        mixes.push({
          label: it.label && it.label.trim().length ? it.label : undefined,
          // forward price if provided
          // @ts-expect-error allow optional price passthrough for mix
          price: (it as any).price && String((it as any).price).trim().length ? (it as any).price : undefined,
          components: comps.map((c) => ({ productId: Number(c.productId), quantity: "1" })),
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
    // Reload from server to reflect saved state
    router.refresh();
  }

  if (hydrating) {
    return <div className="text-muted-foreground text-xs">Memuat item…</div>;
  }

  return (
    <div className="grid gap-3">
      <div className="text-sm font-medium">Item</div>
      {/* Header row */}
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
                  placeholder="55,000"
                  inputMode="decimal"
                />
              </div>
            ) : null}
            <div></div>
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
            {it.components.map((c, j) => (
              <div key={c.id} className="grid grid-cols-1 gap-2 md:grid-cols-[2fr_auto_auto]">
                <select
                  className="w-full rounded-md border px-3 py-2"
                  value={c.productId}
                  onChange={(e) => setComponent(i, j, e.target.value)}
                >
                  <option value="">Pilih Produk</option>
                  {products.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    onClick={() => removeComponentRow(i, j)}
                    disabled={it.components.length <= 1}
                  >
                    Hapus
                  </Button>
                </div>
                {j === it.components.length - 1 ? (
                  <div className="flex items-center">
                    <Button variant="secondary" onClick={() => addComponentRow(i)}>
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
            ))}
          </div>
          {/* Row to add new Item aligned to right-most column */}
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto]">
            <div></div>
            <div></div>
            <div></div>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={addItem}>
                Tambah Item
              </Button>
            </div>
          </div>
        </div>
      ))}
      <div className="flex justify-end">
        <Button onClick={saveAll} disabled={loading}>
          Simpan
        </Button>
      </div>
    </div>
  );
}
