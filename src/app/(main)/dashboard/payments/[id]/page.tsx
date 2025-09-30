import { headers } from "next/headers";

import PaymentClient from "./_components/payment-client";

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

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bookingId = Number(id);
  const [booking, estimate, deposits, payments] = await Promise.all([
    fetchJSON(`/api/bookings/${id}`),
    fetchJSON(`/api/bookings/${id}/billing/estimate`),
    fetchJSON(`/api/bookings/${id}/deposits`).then((d) => (Array.isArray(d) ? d : [])),
    fetchJSON(`/api/bookings/${id}/payments`).then((p) => (Array.isArray(p) ? p : [])),
  ]);

  return (
    <PaymentClient
      bookingId={bookingId}
      booking={booking}
      estimate={estimate}
      deposits={deposits}
      payments={payments}
    />
  );
}
