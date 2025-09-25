/* eslint-disable import/order */
import { headers } from "next/headers";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DepositsTable } from "../_components/deposits-table";
import { DepositForm } from "../_components/deposit-form";

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

export default async function BookingDepositPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await fetchJSON(`/api/bookings/${id}`);
  const deposits = await fetchJSON(`/api/bookings/${id}/deposits`);
  const last = Array.isArray(deposits) && deposits.length ? deposits[0] : null;
  const estimate = await fetchJSON(`/api/bookings/${id}/billing/estimate`);
  const totalDeposit = Array.isArray(deposits)
    ? deposits.reduce((sum: number, d: unknown) => {
        const deposit = d as Record<string, unknown>;
        return sum + Number(deposit.amount ?? 0);
      }, 0)
    : 0;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Deposit Booking #{id}</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/bookings/${id}`}>Kembali ke Detail</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/bookings">Daftar Booking</Link>
          </Button>
        </div>
      </div>
      {booking?.serviceType?.pricePerDay ? (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Total Deposit</CardTitle>
                <CardDescription className="text-base tabular-nums">
                  Rp {Number(totalDeposit).toLocaleString("id-ID")}
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Biaya Saat Ini</CardTitle>
                <CardDescription className="text-base tabular-nums">
                  Rp {Number(estimate?.totalProducts ?? 0).toLocaleString("id-ID")}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <DepositForm
            bookingId={Number(id)}
            initial={{
              estimatedTotal: last?.estimatedTotal,
              method: last?.method,
              startDate: booking?.startDate ? new Date(booking.startDate).toISOString().slice(0, 10) : undefined,
              endDate: booking?.endDate ? new Date(booking.endDate).toISOString().slice(0, 10) : undefined,
            }}
          />

          <Card>
            <CardHeader>
              <CardTitle>Riwayat Deposit</CardTitle>
            </CardHeader>
            <CardContent>
              <DepositsTable bookingId={Number(id)} items={Array.isArray(deposits) ? deposits : []} />
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-muted-foreground text-sm">Deposit hanya untuk layanan per-hari</div>
      )}
    </div>
  );
}
