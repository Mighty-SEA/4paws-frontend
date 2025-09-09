import { cookies, headers } from "next/headers";

import { OwnerTable } from "./_components/owner-table";

async function getInitialOwners() {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "http";
  const base = `${protocol}://${host}`;
  const cookie = hdrs.get("cookie") ?? "";
  const res = await fetch(`${base}/api/owners?page=1&pageSize=10`, {
    cache: "no-store",
    headers: { cookie },
  });
  if (!res.ok) {
    return { items: [], total: 0, page: 1, pageSize: 10 };
  }
  return res.json();
}
export default async function OwnersPage() {
  await cookies();
  const initial = await getInitialOwners();
  return <OwnerTable initial={initial} />;
}

