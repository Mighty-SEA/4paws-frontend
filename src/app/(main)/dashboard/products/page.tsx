import { headers } from "next/headers";

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
  const availableMap: Record<number, number> = {};
  await Promise.all(
    (Array.isArray(products) ? products : []).map(async (p: any) => {
      const a = await fetchJSON(`/api/inventory/${p.id}/available`);
      availableMap[p.id] = typeof a === "number" ? a : 0;
    }),
  );

  const rows = (Array.isArray(products) ? products : []).map((p: any) => ({
    id: p.id,
    name: p.name,
    unit: p.unit,
    content: p.unitContentAmount && p.unitContentName ? `${p.unitContentAmount} ${p.unitContentName}` : "",
    available: availableMap[p.id] ?? 0,
  }));

  return (
    <div className="grid grid-cols-1 gap-4">
      <ProductForms products={Array.isArray(products) ? products : []} />
      <ProductTable items={rows} />
    </div>
  );
}
