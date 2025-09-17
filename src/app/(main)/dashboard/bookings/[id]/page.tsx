import { headers } from "next/headers";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { CheckoutButton } from "./_components/checkout-button";
import { SplitBooking } from "./_components/split-booking";

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

// eslint-disable-next-line complexity
export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await fetchJSON(`/api/bookings/${id}`);
  const deposits = await fetchJSON(`/api/bookings/${id}/deposits`);
  const totalDeposit = Array.isArray(deposits)
    ? deposits.reduce((sum: number, d: any) => sum + Number(d.amount ?? 0), 0)
    : 0;
  const estimate = await fetchJSON(`/api/bookings/${id}/billing/estimate`);
  const payments = await fetchJSON(`/api/bookings/${id}/payments`);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Booking #{id}</h1>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href={`/dashboard/bookings/${id}/examination`}>Pemeriksaan</Link>
          </Button>
          {booking?.serviceType?.pricePerDay && booking?.proceedToAdmission ? (
            <Button asChild variant="secondary">
              <Link href={`/dashboard/bookings/${id}/visit`}>Visit</Link>
            </Button>
          ) : null}
          {booking?.status === "COMPLETED" ? (
            <Button asChild variant="outline">
              <Link href={`/dashboard/bookings/${id}/invoice`}>Unduh Invoice</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href="/dashboard/bookings">Back</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div>Owner: {booking?.owner?.name ?? "-"}</div>
          <div>Service: {booking?.serviceType?.service?.name ?? "-"}</div>
          <div>Type: {booking?.serviceType?.name ?? "-"}</div>
          <div>Status: {booking?.status ?? "-"}</div>
          <div>Start: {booking?.startDate ? new Date(booking.startDate).toLocaleDateString() : "-"}</div>
          <div>End: {booking?.endDate ? new Date(booking.endDate).toLocaleDateString() : "-"}</div>
          {booking?.serviceType?.pricePerDay ? (
            <>
              <div>Total Daily: Rp {Number(estimate?.totalDaily ?? 0).toLocaleString("id-ID")}</div>
              <div>Total Products: Rp {Number(estimate?.totalProducts ?? 0).toLocaleString("id-ID")}</div>
              <div>Total: Rp {Number(estimate?.total ?? 0).toLocaleString("id-ID")}</div>
              <div>Deposit: Rp {Number(estimate?.depositSum ?? 0).toLocaleString("id-ID")}</div>
              <div>Sisa Tagihan: Rp {Number(estimate?.amountDue ?? 0).toLocaleString("id-ID")}</div>
            </>
          ) : null}
        </CardContent>
      </Card>
      {booking?.serviceType?.pricePerDay && booking?.proceedToAdmission ? (
        <Card>
          <CardHeader>
            <CardTitle>Deposit</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div>Total Deposit: Rp {totalDeposit.toLocaleString("id-ID")}</div>
            {Array.isArray(deposits) && deposits.length ? (
              <div className="grid gap-1">
                {deposits.map((d: any) => (
                  <div key={d.id} className="rounded-md border p-2 text-xs">
                    <div>{new Date(d.depositDate).toLocaleString()}</div>
                    <div>Jumlah: Rp {Number(d.amount ?? 0).toLocaleString("id-ID")}</div>
                    <div>Metode: {d.method ?? "-"}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-xs">Belum ada deposit</div>
            )}
          </CardContent>
        </Card>
      ) : null}
      {Array.isArray(payments) && payments.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {payments.map((p: any) => (
              <div key={p.id} className="rounded-md border p-2 text-xs">
                <div>{new Date(p.paymentDate).toLocaleString()}</div>
                <div>Jumlah: Rp {Number(p.total ?? 0).toLocaleString("id-ID")}</div>
                <div>Metode: {p.method ?? "-"}</div>
                <div>Invoice: {p.invoiceNo ?? "-"}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
      {(booking?.serviceType?.pricePerDay && booking?.status === "IN_PROGRESS") ||
      (!booking?.serviceType?.pricePerDay && Number(estimate?.amountDue ?? 0) > 0) ? (
        <div className="flex justify-end">
          <CheckoutButton bookingId={Number(id)} />
        </div>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pemeriksaan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {booking?.pets?.length ? (
            booking.pets.map((bp: any) => (
              <div key={bp.id} className="grid gap-2">
                <div className="text-sm font-medium">{bp.pet?.name}</div>
                <div className="grid gap-2">
                  {bp.examinations?.length ? (
                    bp.examinations.map((ex: any) => (
                      <div key={ex.id} className="rounded-md border p-2 text-xs">
                        <div>
                          W: {ex.weight ?? "-"} kg, T: {ex.temperature ?? "-"} °C
                        </div>
                        <div>Notes: {ex.notes ?? "-"}</div>
                        {ex.productUsages?.length ? (
                          <div>
                            Products:{" "}
                            {ex.productUsages.map((pu: any) => `${pu.productName} (${pu.quantity})`).join(", ")}
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground text-xs">Belum ada pemeriksaan</div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-muted-foreground text-sm">Tidak ada pet</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Pets</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {booking?.pets?.length ? (
            booking.pets.map((bp: { id: number; pet?: { name?: string } }) => (
              <div key={bp.id} className="rounded-md border p-2 text-sm">
                {bp.pet?.name}
              </div>
            ))
          ) : (
            <div className="text-muted-foreground text-sm">Tidak ada pet</div>
          )}
        </CardContent>
      </Card>
      {Array.isArray(booking?.pets) && booking.pets.length > 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Pisahkan Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <SplitBooking
              bookingId={Number(id)}
              pets={booking.pets.map((bp: any) => ({ id: bp.pet?.id, name: bp.pet?.name }))}
            />
          </CardContent>
        </Card>
      ) : null}
      {/* Tidak ada form pemeriksaan di halaman view */}
    </div>
  );
}
