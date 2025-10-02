/* eslint-disable import/order */

import { headers } from "next/headers";
import { VisitHistory } from "../../_components/visit-history";

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

export default async function VisitHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await fetchJSON(`/api/bookings/${id}`);

  return (
    <div className="flex flex-col gap-4">
      {booking?.pets?.length ? (
        <div className="grid gap-4">
          {booking.pets.map((bp: any) => (
            <div key={bp.id} className="grid gap-2">
              <div className="text-sm font-medium">{bp.pet?.name}</div>
              <VisitHistory
                bookingId={booking.id}
                visits={Array.isArray(bp.visits) ? bp.visits : []}
                items={Array.isArray(booking?.items) ? booking.items : []}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground text-sm">Tidak ada pet pada booking ini</div>
      )}
    </div>
  );
}
