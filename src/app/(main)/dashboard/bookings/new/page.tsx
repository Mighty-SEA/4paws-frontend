import { headers } from "next/headers";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { BookingForm } from "./_components/booking-form";

async function fetchJSON(path: string) {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "http";
  const base = `${protocol}://${host}`;
  const cookie = hdrs.get("cookie") ?? "";
  const res = await fetch(`${base}${path}`, {
    headers: { cookie },
    next: { revalidate: 60, tags: ["owners", "services"] },
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function NewBookingPage() {
  const [services, owners] = await Promise.all([
    fetchJSON("/api/services"),
    fetchJSON("/api/owners?page=1&pageSize=20"), // Reduced from 100 to 20
  ]);

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Buat Booking Baru</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard/bookings">Kembali ke Bookings</Link>
        </Button>
      </div>
      <BookingForm
        services={Array.isArray(services) ? services : []}
        owners={Array.isArray(owners?.items) ? owners.items : []}
      />
    </div>
  );
}
