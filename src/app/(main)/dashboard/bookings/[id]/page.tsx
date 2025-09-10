import { headers } from "next/headers";
import Link from "next/link";

import { Button } from "@/components/ui/button";
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

// eslint-disable-next-line complexity
export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await fetchJSON(`/api/bookings/${id}`);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Booking #{id}</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard/bookings">Back</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div>Owner: {booking?.owner?.name ?? '-'}</div>
          <div>Service: {booking?.serviceType?.service?.name ?? '-'}</div>
          <div>Type: {booking?.serviceType?.name ?? '-'}</div>
          <div>Status: {booking?.status ?? '-'}</div>
          <div>Start: {booking?.startDate ? new Date(booking.startDate).toLocaleDateString() : '-'}</div>
          <div>End: {booking?.endDate ? new Date(booking.endDate).toLocaleDateString() : '-'}</div>
        </CardContent>
      </Card>
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
                        <div>W: {ex.weight ?? '-'} kg, T: {ex.temperature ?? '-'} °C</div>
                        <div>Notes: {ex.notes ?? '-'}</div>
                        {ex.productUsages?.length ? (
                          <div>Products: {ex.productUsages.map((pu: any) => `${pu.productName} (${pu.quantity})`).join(', ')}</div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground">Belum ada pemeriksaan</div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">Tidak ada pet</div>
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
              <div key={bp.id} className="rounded-md border p-2 text-sm">{bp.pet?.name}</div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">Tidak ada pet</div>
          )}
        </CardContent>
      </Card>
      {/* Tidak ada form pemeriksaan di halaman view */}
    </div>
  );
}

