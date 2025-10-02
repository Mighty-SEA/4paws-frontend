import { headers } from "next/headers";

import { BookingDetailWrapper } from "./_components/booking-detail-wrapper";

async function fetchJSON(path: string) {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "http";
  const base = `${protocol}://${host}`;
  const cookie = hdrs.get("cookie") ?? "";
  const res = await fetch(`${base}${path}`, {
    headers: { cookie },
    next: { revalidate: 30, tags: ["booking-detail"] },
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Use lightweight summary endpoint instead of full booking data
  const [summary, deposits, estimate, payments, invoice] = await Promise.all([
    fetchJSON(`/api/bookings/${id}/summary`),
    fetchJSON(`/api/bookings/${id}/deposits`),
    fetchJSON(`/api/bookings/${id}/billing/estimate`),
    fetchJSON(`/api/bookings/${id}/payments`),
    fetchJSON(`/api/bookings/${id}/billing/invoice`),
  ]);

  return (
    <BookingDetailWrapper
      id={id}
      summary={summary}
      deposits={deposits}
      estimate={estimate}
      payments={payments}
      invoice={invoice}
    />
  );
}
