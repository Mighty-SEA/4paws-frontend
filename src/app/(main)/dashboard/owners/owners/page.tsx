import { cookies, headers } from "next/headers";

import { OwnerTable } from "../_components/owner-table";

async function getInitialOwners() {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "http";
  const base = `${protocol}://${host}`;
  const cookie = hdrs.get("cookie") ?? "";
  const res = await fetch(`${base}/api/owners?page=1&pageSize=10`, {
    headers: { cookie },
    next: { revalidate: 30, tags: ["owners"] },
  });
  if (!res.ok) {
    return { items: [], total: 0, page: 1, pageSize: 10 };
  }
  return res.json();
}

export default async function OwnersListPage() {
  await cookies();
  const initial = await getInitialOwners();
  // Compute filtered pet counts (exclude name "Petshop") for first page on server to avoid UI flicker
  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "http";
  const base = `${protocol}://${host}`;
  const cookie = hdrs.get("cookie") ?? "";
  const itemsWithCounts = await Promise.all(
    (Array.isArray(initial?.items) ? initial.items : []).map(async (it: any) => {
      try {
        const r = await fetch(`${base}/api/owners/${it.id}`, {
          headers: { cookie },
          next: { revalidate: 60, tags: ["owner-detail"] },
        });
        const d = await r.json().catch(() => null);
        const filtered = Array.isArray(d?.pets)
          ? d.pets.filter((p: any) => String(p?.name ?? "").toLowerCase() !== "petshop").length
          : 0;
        return { ...it, petCountFiltered: filtered };
      } catch {
        return { ...it };
      }
    }),
  );
  const initialWithCounts = { ...initial, items: itemsWithCounts };

  return <OwnerTable initial={initialWithCounts} />;
}
