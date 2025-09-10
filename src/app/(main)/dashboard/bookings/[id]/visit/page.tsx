/* eslint-disable import/order */

import { headers } from "next/headers";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisitForm } from "../_components/visit-form";

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

export default async function BookingVisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await fetchJSON(`/api/bookings/${id}`);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Visit Booking #{id}</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/bookings/${id}`}>Kembali ke Detail</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/dashboard/bookings/${id}/examination`}>Pemeriksaan</Link>
          </Button>
        </div>
      </div>
      {booking?.serviceType?.pricePerDay ? (
        booking?.pets?.length ? (
          <div className="grid gap-4">
            {booking.pets.map((bp: any) => (
              <div key={bp.id} className="grid gap-2">
                <div className="text-sm font-medium">{bp.pet?.name}</div>
                <Tabs defaultValue="form" className="w-full">
                  <TabsList>
                    <TabsTrigger value="form">Form Visit</TabsTrigger>
                    <TabsTrigger value="history">Riwayat Visit</TabsTrigger>
                  </TabsList>
                  <TabsContent value="form">
                    <VisitForm bookingId={booking.id} bookingPetId={bp.id} />
                  </TabsContent>
                  <TabsContent value="history">
                    {bp.visits?.length ? (
                      <div className="grid gap-2">
                        {bp.visits.map((v: any) => (
                          <div key={v.id} className="rounded-md border p-2 text-xs">
                            <div>{new Date(v.visitDate).toLocaleString()}</div>
                            <div>
                              W: {v.weight ?? "-"} kg, T: {v.temperature ?? "-"} °C
                            </div>
                            <div>Notes: {v.notes ?? "-"}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-sm">Belum ada visit</div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">Tidak ada pet pada booking ini</div>
        )
      ) : (
        <div className="text-muted-foreground text-sm">Visit hanya untuk layanan per-hari</div>
      )}
    </div>
  );
}
