/* eslint-disable import/order */

import { headers } from "next/headers";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisitForm } from "../_components/visit-form";
import { VisitHistory } from "../_components/visit-history";
import { BookingItems } from "../_components/booking-items";

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

export default async function BookingVisitPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const booking = await fetchJSON(`/api/bookings/${id}`);
  const products = (await fetchJSON(`/api/products`)) ?? [];
  const min = booking?.startDate ? new Date(booking.startDate).toISOString().slice(0, 16) : undefined;
  const max = booking?.endDate ? new Date(booking.endDate).toISOString().slice(0, 16) : undefined;
  const priceMap: Record<string, number> = Array.isArray(products)
    ? Object.fromEntries(products.map((p: any) => [p.name, Number(p.price ?? 0)]))
    : {};
  const sp = searchParams ? await searchParams : {};
  const tabDefault = String((sp as any).tab ?? "") === "form" ? "form" : "history";
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Visit Booking #{id}</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/bookings/${id}`}>Kembali ke Detail</Link>
          </Button>
        </div>
      </div>
      {booking?.pets?.length ? (
        <div className="grid gap-4">
          {booking.pets.map((bp: any) => (
            <div key={bp.id} className="grid gap-2">
              <div className="text-sm font-medium">{bp.pet?.name}</div>
              <Tabs defaultValue={tabDefault} className="w-full">
                <TabsList>
                  <TabsTrigger value="form">Form Visit</TabsTrigger>
                  <TabsTrigger value="history">Riwayat Visit</TabsTrigger>
                </TabsList>
                <TabsContent value="form">
                  <VisitForm
                    bookingId={booking.id}
                    bookingPetId={bp.id}
                    ownerName={booking.owner?.name}
                    petName={bp.pet?.name}
                    minDate={min}
                    maxDate={max}
                    booking={booking}
                  />
                </TabsContent>
                <TabsContent value="history">
                  <VisitHistory
                    bookingId={booking.id}
                    visits={Array.isArray(bp.visits) ? bp.visits : []}
                    items={Array.isArray(booking?.items) ? booking.items : []}
                  />
                </TabsContent>
                {null}
              </Tabs>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground text-sm">Tidak ada pet pada booking ini</div>
      )}
    </div>
  );
}
