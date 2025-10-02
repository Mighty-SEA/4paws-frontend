import { headers } from "next/headers";

import { InventoryTable } from "../_components/inventory-table";

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

export default async function InventoryHistoryPage() {
  const history = await fetchJSON(`/api/inventory?limit=50&types=IN,ADJUSTMENT`);

  return (
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
  );
}
