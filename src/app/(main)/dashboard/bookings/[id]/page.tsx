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
  const [summary, deposits, estimate, payments, invoice, bookingDetail] = await Promise.all([
    fetchJSON(`/api/bookings/${id}/summary`),
    fetchJSON(`/api/bookings/${id}/deposits`),
    fetchJSON(`/api/bookings/${id}/billing/estimate`),
    fetchJSON(`/api/bookings/${id}/payments`),
    fetchJSON(`/api/bookings/${id}/billing/invoice`),
    fetchJSON(`/api/bookings/${id}`),
  ]);

  const serviceName = String(summary?.serviceType?.service?.name ?? bookingDetail?.serviceType?.service?.name ?? "");
  const serviceTypeName = String(summary?.serviceType?.name ?? bookingDetail?.serviceType?.name ?? "");
  const isPerDayBooking = /rawat inap|pet hotel/i.test(`${serviceName} ${serviceTypeName}`);

  const finalSummary = summary
    ? {
        ...summary,
        isPerDay: isPerDayBooking,
      }
    : summary;

  const baseTotal = Number(estimate?.total ?? 0);
  const primaryServicePrice = Number(bookingDetail?.serviceType?.price ?? 0);
  const primaryPerDayPrice = Number(bookingDetail?.serviceType?.pricePerDay ?? 0);
  const shouldShowPayment = baseTotal > 0 || primaryServicePrice > 0 || primaryPerDayPrice > 0;

  const summaryWithExtras = summary
    ? {
        ...summary,
        isPerDay: isPerDayBooking,
        shouldShowPayment,
        standaloneTotals: bookingDetail?.pets?.map((bp: any) => ({
          bookingPetId: bp.id,
          petName: bp.pet?.name,
          productsTotal: bp.productUsages?.reduce((sum: number, pu: any) => sum + Number(pu.quantity ?? 0) * Number(pu.unitPrice ?? 0), 0) ?? 0,
          mixTotal: bp.mixUsages?.reduce((sum: number, mu: any) => sum + Number(mu.quantity ?? 0) * Number(mu.unitPrice ?? mu.mixProduct?.price ?? 0), 0) ?? 0,
        })),
      }
    : summary;

  return (
    <BookingDetailWrapper
      id={id}
      summary={summaryWithExtras}
      deposits={deposits}
      estimate={estimate}
      payments={payments}
      invoice={invoice}
    />
  );
}
