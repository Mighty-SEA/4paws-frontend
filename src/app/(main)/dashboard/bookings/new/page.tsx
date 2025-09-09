import { headers } from "next/headers";
/* eslint-disable import/order */
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { BookingForm } from "./_components/booking-form";

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

export default async function NewBookingPage() {
  const services = await fetchJSON("/api/services");
  const owners = await fetchJSON("/api/owners?page=1&pageSize=100");
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Buat Booking</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back</Link>
        </Button>
      </div>
      <BookingForm services={Array.isArray(services) ? services : []} owners={Array.isArray(owners?.items) ? owners.items : []} />
    </div>
  );
}

