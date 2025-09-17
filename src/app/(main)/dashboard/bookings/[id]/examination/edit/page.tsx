import { headers } from "next/headers";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ExaminationFormsGroup } from "../../_components/examination-forms-group";

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

export default async function EditPreAdmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await fetchJSON(`/api/bookings/${id}`);
  // Build initial map from last examination per booking pet
  const initialByBookingPetId: Record<number, any> = {};
  if (Array.isArray(booking?.pets)) {
    for (const bp of booking.pets) {
      const latest =
        Array.isArray(bp.examinations) && bp.examinations.length ? bp.examinations[bp.examinations.length - 1] : null;
      if (latest) {
        initialByBookingPetId[bp.id] = {
          weight: latest.weight,
          temperature: latest.temperature,
          notes: latest.notes,
          products: Array.isArray(latest.productUsages)
            ? latest.productUsages.map((pu: any) => ({ productName: pu.productName, quantity: pu.quantity }))
            : [],
          mixes: Array.isArray(latest.mixUsages)
            ? latest.mixUsages.map((mu: any) => ({ mixProductId: mu.mixProductId, quantity: mu.quantity }))
            : [],
        };
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Edit Periksa Pra Ranap Booking #{id}</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/bookings/${id}`}>Kembali ke Detail</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/bookings">Daftar Booking</Link>
          </Button>
        </div>
      </div>
      {booking?.pets?.length ? (
        <ExaminationFormsGroup
          bookingId={booking.id}
          perDay={Boolean(booking?.serviceType?.pricePerDay)}
          pets={booking.pets.map((bp: any) => ({ id: bp.id, name: bp.pet?.name }))}
          initialByBookingPetId={initialByBookingPetId}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Periksa Pra Ranap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-sm">Tidak ada pet pada booking ini</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
