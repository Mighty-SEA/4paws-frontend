import { headers } from "next/headers";

import { ProductForms } from "../_components/product-forms";
import { ProductTable } from "../_components/product-table";

async function fetchJSON(path: string) {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "http";
  const base = `${protocol}://${host}`;
  const cookie = hdrs.get("cookie") ?? "";
  const res = await fetch(`${base}${path}`, { headers: { cookie }, next: { revalidate: 60, tags: ["products"] } });
  if (!res.ok) return null;
  return res.json();
}

export default async function ProductsListPage() {
  // Use new endpoint that includes inventory availability
  const productsWithInventory = (await fetchJSON("/api/products/with-inventory")) ?? [];

  const rows = (Array.isArray(productsWithInventory) ? productsWithInventory : []).map((p: any) => ({
    id: p.id,
    name: p.name,
    unit: p.unit,
    content: p.unitContentAmount && p.unitContentName ? `${p.unitContentAmount} ${p.unitContentName}` : "",
    available: p.available ?? 0,
    price: p.price != null ? Number(p.price) : undefined,
  }));

  return (
    <div className="grid gap-4">
      <ProductForms products={Array.isArray(productsWithInventory) ? productsWithInventory : []} />
      <ProductTable items={rows} />
    </div>
  );
}
