"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Owner = { id: number; name: string };
type Staff = { id: number; name: string; jobRole: string };

export default function PetshopServicePage() {
  const router = useRouter();
  const [owners, setOwners] = React.useState<Owner[]>([]);
  const [staffs, setStaffs] = React.useState<Staff[]>([]);
  const [products, setProducts] = React.useState<
    Array<{ id: number; name: string; unit?: string; unitContentAmount?: number; unitContentName?: string }>
  >([]);

  const [ownerId, setOwnerId] = React.useState("");
  const [petshopName, setPetshopName] = React.useState("");
  const [adminId, setAdminId] = React.useState("");

  type ItemComponent = { id: string; productId: string; quantity: string };
  type ItemGroup = { id: string; label?: string; price?: string; components: ItemComponent[] };
  const [items, setItems] = React.useState<ItemGroup[]>([
    {
      id: Math.random().toString(36).slice(2),
      label: "",
      price: "",
      components: [{ id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
    },
  ]);

  React.useEffect(() => {
    void (async () => {
      try {
        const [o, s, p] = await Promise.all([
          fetch("/api/owners", { cache: "no-store" }),
          fetch("/api/staff", { cache: "no-store" }),
          fetch("/api/products", { cache: "no-store" }),
        ]);
        if (o.ok) {
          const data = await o.json();
          if (Array.isArray(data)) setOwners(data.map((x: any) => ({ id: x.id, name: x.name })));
        }
        if (s.ok) {
          const data = await s.json();
          if (Array.isArray(data)) setStaffs(data.map((x: any) => ({ id: x.id, name: x.name, jobRole: x.jobRole })));
        }
        if (p.ok) {
          const data = await p.json();
          if (Array.isArray(data))
            setProducts(
              data.map((x: any) => ({
                id: x.id,
                name: x.name,
                unit: x.unit,
                unitContentAmount: x.unitContentAmount,
                unitContentName: x.unitContentName,
              })),
            );
        }
      } catch {
        void 0;
      }
    })();
  }, []);

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        label: "",
        price: "",
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
    const digits = String(value ?? "").replace(/[^0-9]/g, "");
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, price: digits } : it)));
  }
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

  async function saveDraft() {
    const payload = {
      scope: "petshop-service",
      data: {
        ownerId: ownerId ? Number(ownerId) : undefined,
        petshopName: petshopName || undefined,
        adminId: adminId ? Number(adminId) : undefined,
        items,
      },
    };
    const res = await fetch("/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      toast.error("Gagal menyimpan draft");
      return;
    }
    toast.success("Draft Petshop tersimpan");
    router.push("/dashboard/petshop");
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transaksi Petshop</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Data Pelanggan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div>
            <Label className="mb-2 block">Owner</Label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
            >
              <option value="">Pilih Owner</option>
              {owners.map((o) => (
                <option key={o.id} value={String(o.id)}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="mb-2 block">Nama Petshop</Label>
            <Input value={petshopName} onChange={(e) => setPetshopName(e.target.value)} placeholder="Nama petshop" />
          </div>
          <div>
            <Label className="mb-2 block">Admin</Label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
            >
              <option value="">Pilih Admin</option>
              {staffs
                .filter((s) => s.jobRole === "ADMIN")
                .map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pilih Item</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {items.map((it, i) => (
            <div key={it.id} className="grid gap-2 rounded-md border p-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-6">
                <div className="md:col-span-3">
                  <Label className="mb-2 block">Nama Item (opsional)</Label>
                  <Input
                    value={it.label ?? ""}
                    onChange={(e) => setItemLabel(i, e.target.value)}
                    placeholder="Contoh: Paket A"
                  />
                </div>
                {it.components.length > 1 ? (
                  <div className="md:col-span-2">
                    <Label className="mb-2 block">Harga Mix (Rp)</Label>
                    <Input
                      value={it.price ?? ""}
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
                  const prod = products.find((x) => String(x.id) === c.productId);
                  const unitLabel = prod?.unitContentName ?? prod?.unit ?? "unit";
                  return (
                    <div key={c.id} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto_auto]">
                      <select
                        className="w-full rounded-md border px-3 py-2"
                        value={c.productId}
                        onChange={(e) => setComponent(i, j, "productId", e.target.value)}
                      >
                        <option value="">Pilih Produk</option>
                        {products.map((p) => (
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
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button onClick={saveDraft}>Simpan Draft</Button>
      </div>
    </div>
  );
}
