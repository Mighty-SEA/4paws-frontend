import { headers } from "next/headers";

import { MixForms } from "../_components/mix-forms";
import { MixTable, type MixRow } from "../_components/mix-table";

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

export default async function MixProductsPage() {
  const [products, mixes] = await Promise.all([fetchJSON("/api/products"), fetchJSON("/api/mix-products")]);

  const mixRows: MixRow[] = (Array.isArray(mixes) ? mixes : []).map((m: any) => ({
    id: m.id,
    name: m.name,
    components: Array.isArray(m.components)
      ? m.components.map((c: any) => `${c.product?.name ?? c.productId} (${Number(c.quantityBase)})`).join(", ")
      : "",
    price: m.price != null ? Number(m.price) : undefined,
  }));

  return (
    <div className="grid gap-4">
      <MixForms products={Array.isArray(products) ? products : []} />
      <MixTable items={mixRows} />
    </div>
  );
}
