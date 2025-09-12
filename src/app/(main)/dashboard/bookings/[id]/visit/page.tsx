/* eslint-disable import/order */

import { headers } from "next/headers";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisitForm } from "../_components/visit-form";
import { DailyChargesTab } from "../_components/daily-charges-tab";

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
  const products = (await fetchJSON(`/api/products`)) ?? [];
  const priceMap: Record<string, number> = Array.isArray(products)
    ? Object.fromEntries(products.map((p: any) => [p.name, Number(p.price ?? 0)]))
    : {};
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
                    <TabsTrigger value="daily">Biaya Harian</TabsTrigger>
                  </TabsList>
                  <TabsContent value="form">
                    <VisitForm bookingId={booking.id} bookingPetId={bp.id} />
                  </TabsContent>
                  <TabsContent value="history">
                    {bp.visits?.length ? (
                      <div className="grid gap-2">
                        {bp.visits.map((v: any) => {
                          const products = Array.isArray(v.productUsages)
                            ? v.productUsages.map((pu: any) => `${pu.productName} (${pu.quantity})`).join(", ")
                            : "";
                          const mixes = Array.isArray(v.mixUsages)
                            ? v.mixUsages
                                .map((mu: any) => `${mu.mixProduct?.name ?? mu.mixProductId} (${Number(mu.quantity)})`)
                                .join(", ")
                            : "";
                          const productsCost = Array.isArray(v.productUsages)
                            ? v.productUsages.reduce(
                                (s: number, pu: any) =>
                                  s + Number(pu.quantity) * Number(pu.unitPrice ?? priceMap[pu.productName] ?? 0),
                                0,
                              )
                            : 0;
                          const mixesCost = Array.isArray(v.mixUsages)
                            ? v.mixUsages.reduce(
                                (s: number, mu: any) =>
                                  s + Number(mu.quantity) * Number(mu.unitPrice ?? mu.mixProduct?.price ?? 0),
                                0,
                              )
                            : 0;
                          const totalCost = productsCost + mixesCost;
                          return (
                            <div key={v.id} className="rounded-md border p-2 text-xs">
                              <div className="font-medium">Visit Booking #{id}</div>
                              <div>{new Date(v.visitDate).toLocaleString()}</div>
                              <div>
                                W: {v.weight ?? "-"} kg, T: {v.temperature ?? "-"} °C
                              </div>
                              <div>Notes: {v.notes ?? "-"}</div>
                              {products ? <div>Produk: {products}</div> : null}
                              {mixes ? <div>Mix: {mixes}</div> : null}
                              <div className="mt-1 font-medium">
                                biaya: Rp {Number(totalCost).toLocaleString("id-ID")}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-sm">Belum ada visit</div>
                    )}
                  </TabsContent>
                  <TabsContent value="daily">
                    <DailyChargesTab bookingId={booking.id} bookingPetId={bp.id} />
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
