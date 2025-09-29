/* eslint-disable import/order */
import { headers } from "next/headers";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ExaminationFormsGroup } from "../_components/examination-forms-group";
import { SplitBooking } from "../_components/split-booking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default async function BookingExaminationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await fetchJSON(`/api/bookings/${id}`);
  const svcName = String(booking?.serviceType?.service?.name ?? "");
  const typeName = String(booking?.serviceType?.name ?? "");
  const hasGroomAddon = Array.isArray(booking?.items)
    ? booking.items.some((it: any) => {
        const sn = String(it?.serviceType?.service?.name ?? "");
        const tn = String(it?.serviceType?.name ?? "");
        return `${sn} ${tn}`.toLowerCase().includes("groom");
      })
    : false;
  const isGroomingService = `${svcName} ${typeName}`.toLowerCase().includes("groom") || hasGroomAddon;
  // Deposit flow only for Service name: Rawat Inap or Pet Hotel (ignoring service type)
  const isPerDay = /rawat inap|pet hotel/i.test(svcName);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {/rawat inap|pet hotel/i.test(svcName) ? "Periksa Pra Ranap" : "Pemeriksaan"} Booking #{id}
        </h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/bookings/${id}`}>Kembali ke Detail</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/bookings">Daftar Booking</Link>
          </Button>
          {null}
        </div>
      </div>
      {booking?.pets?.length ? (
        <ExaminationFormsGroup
          bookingId={booking.id}
          pets={booking.pets.map((bp: any) => ({ id: bp.id, name: bp.pet?.name }))}
          isGroomingService={isGroomingService}
          isPerDay={/rawat inap|pet hotel/i.test(svcName)}
        />
      ) : (
        <div className="text-muted-foreground text-sm">Tidak ada pet pada booking ini</div>
      )}
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
    </div>
  );
}
