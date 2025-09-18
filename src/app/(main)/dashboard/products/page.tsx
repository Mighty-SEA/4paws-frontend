import { headers } from "next/headers";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { InventoryTable } from "./_components/inventory-table";
import { MixForms } from "./_components/mix-forms";
import { MixTable, type MixRow } from "./_components/mix-table";
import { ProductForms } from "./_components/product-forms";
import { ProductTable } from "./_components/product-table";

async function fetchJSON(path: string) {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "http";
  const base = `${protocol}://${host}`;
  const cookie = hdrs.get("cookie") ?? "";
  const res = await fetch(`${base}${path}`, { headers: { cookie }, cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function ProductsPage() {
  const products = (await fetchJSON("/api/products")) ?? [];
  const mixes = (await fetchJSON("/api/mix-products")) ?? [];
  const availableMap: Record<number, number> = {};
  await Promise.all(
    (Array.isArray(products) ? products : []).map(async (p: any) => {
      const a = await fetchJSON(`/api/inventory/${p.id}/available`);
      availableMap[p.id] = typeof a === "number" ? a : 0;
    }),
  );
  const history = await fetchJSON(`/api/inventory?limit=50&types=IN,ADJUSTMENT`);

  const rows = (Array.isArray(products) ? products : []).map((p: any) => ({
    id: p.id,
    name: p.name,
    unit: p.unit,
    content: p.unitContentAmount && p.unitContentName ? `${p.unitContentAmount} ${p.unitContentName}` : "",
    available: availableMap[p.id] ?? 0,
    price: p.price != null ? Number(p.price) : undefined,
  }));

  const mixRows: MixRow[] = (Array.isArray(mixes) ? mixes : []).map((m: any) => ({
    id: m.id,
    name: m.name,
    components: Array.isArray(m.components)
      ? m.components.map((c: any) => `${c.product?.name ?? c.productId} (${Number(c.quantityBase)})`).join(", ")
      : "",
    price: m.price != null ? Number(m.price) : undefined,
  }));

  return (
    <div className="grid grid-cols-1 gap-4">
      <Tabs defaultValue="products" className="w-full">
        <TabsList>
          <TabsTrigger value="products">Produk</TabsTrigger>
          <TabsTrigger value="mix">Mix Product</TabsTrigger>
          <TabsTrigger value="history">Riwayat Restock/Adjustment</TabsTrigger>
        </TabsList>
        <TabsContent value="products">
          <ProductForms products={Array.isArray(products) ? products : []} />
          <ProductTable items={rows} />
        </TabsContent>
        <TabsContent value="mix">
          <MixForms products={Array.isArray(products) ? products : []} />
          <MixTable items={mixRows} />
        </TabsContent>
        <TabsContent value="history">
          <InventoryTable
            items={
              Array.isArray(history)
                ? history.map((h: any) => ({
                    id: h.id,
                    createdAt: h.createdAt,
                    productName: h.product?.name ?? String(h.productId),
                    unit: h.product?.unit ?? "",
                    type: h.type,
                    quantity: Number(h.quantity),
                    note: h.note ?? undefined,
                  }))
                : []
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
