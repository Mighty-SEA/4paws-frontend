/* eslint-disable import/order */

import { headers } from "next/headers";
import { VisitForm } from "../../_components/visit-form";

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

export default async function VisitFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await fetchJSON(`/api/bookings/${id}`);
  const min = booking?.startDate ? new Date(booking.startDate).toISOString().slice(0, 16) : undefined;
  const max = booking?.endDate ? new Date(booking.endDate).toISOString().slice(0, 16) : undefined;

  return (
    <div className="flex flex-col gap-4">
      {booking?.pets?.length ? (
        <div className="grid gap-4">
          {booking.pets.map((bp: any) => (
            <div key={bp.id} className="grid gap-2">
              <div className="text-sm font-medium">{bp.pet?.name}</div>
              <VisitForm
                bookingId={booking.id}
                bookingPetId={bp.id}
                ownerName={booking.owner?.name}
                petName={bp.pet?.name}
                minDate={min}
                maxDate={max}
                booking={booking}
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
