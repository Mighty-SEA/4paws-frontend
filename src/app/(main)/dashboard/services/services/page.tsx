import { headers } from "next/headers";

import { ServiceTable } from "../_components/service-tables";

async function getData(path: string) {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "http";
  const base = `${protocol}://${host}`;
  const cookie = hdrs.get("cookie") ?? "";
  const res = await fetch(`${base}${path}`, {
    headers: { cookie },
    next: { revalidate: 60, tags: ["services"] },
  });
  if (!res.ok) return [] as never[];
  return res.json();
}

export default async function ServicesListPage() {
  const services = await getData("/api/services");

  return <ServiceTable items={services} />;
}
