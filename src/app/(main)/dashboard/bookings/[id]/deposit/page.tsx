/* eslint-disable import/order */
import { headers } from "next/headers";
import Link from "next/link";

import { Button } from "@/components/ui/button";
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
        <DepositForm bookingId={Number(id)} />
      ) : (
        <div className="text-muted-foreground text-sm">Deposit hanya untuk layanan per-hari</div>
      )}
    </div>
  );
}
