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

  // Map to include petCount from _count.pets (backend already provides this)
  const itemsWithCounts = (Array.isArray(initial?.items) ? initial.items : []).map((it: any) => ({
    ...it,
    // eslint-disable-next-line no-underscore-dangle
    petCount: it._count?.pets ?? 0,
  }));

  const initialWithCounts = { ...initial, items: itemsWithCounts };

  return <OwnerTable initial={initialWithCounts} />;
}
