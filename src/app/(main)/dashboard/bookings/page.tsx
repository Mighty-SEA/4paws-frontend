import { headers } from "next/headers";

import { BookingTable } from "./_components/booking-table";
import type { BookingRow } from "./_components/columns";
import { BookingForm } from "./new/_components/booking-form";

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

export default async function BookingsPage() {
  const [data, services, owners] = await Promise.all([
    fetchJSON("/api/bookings?page=1&pageSize=10"),
    fetchJSON("/api/services"),
    fetchJSON("/api/owners?page=1&pageSize=100"),
  ]);
  const mapped = data
    ? {
        ...data,
        items: (data.items as any[]).map((b) => ({
          id: b.id,
          ownerName: b.owner?.name ?? "-",
          serviceName: b.serviceType?.service?.name ?? "-",
          serviceTypeName: b.serviceType?.name ?? "-",
          status: b.status,
          createdAt: b.createdAt,
        })) as BookingRow[],
      }
    : { items: [], total: 0, page: 1, pageSize: 10 };
  return (
    <div className="grid grid-cols-1 gap-4">
      <BookingForm services={Array.isArray(services) ? services : []} owners={Array.isArray(owners?.items) ? owners.items : []} />
      <BookingTable initial={mapped} />
    </div>
  );
}

