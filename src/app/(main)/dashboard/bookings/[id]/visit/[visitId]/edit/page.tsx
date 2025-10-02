import { headers } from "next/headers";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { VisitForm } from "../../../_components/visit-form";
import { VisitHistory } from "../../../_components/visit-history";

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

export default async function EditVisitPage({ params }: { params: Promise<{ id: string; visitId: string }> }) {
  const { id, visitId } = await params;
  const booking = await fetchJSON(`/api/bookings/${id}`);
  const visit = Array.isArray(booking?.pets)
    ? booking.pets.flatMap((bp: any) => bp.visits ?? []).find((v: any) => String(v.id) === String(visitId))
    : null;
  const min = booking?.startDate ? new Date(booking.startDate).toISOString().slice(0, 16) : undefined;
  const max = booking?.endDate ? new Date(booking.endDate).toISOString().slice(0, 16) : undefined;
  const bp = visit && Array.isArray(booking?.pets) ? booking.pets.find((x: any) => x.id === visit.bookingPetId) : null;
  const existingMixUsageIds: number[] = Array.isArray(visit?.mixUsages)
    ? visit.mixUsages.map((mu: any) => Number(mu.id)).filter((n: any) => Number.isFinite(n))
    : [];

  const initial = visit
    ? {
        visitDate: visit?.visitDate ? new Date(visit.visitDate).toISOString().slice(0, 16) : undefined,
        weight: visit?.weight,
        temperature: visit?.temperature,
        notes: visit?.notes,
        urine: visit?.urine,
        defecation: visit?.defecation,
        appetite: visit?.appetite,
        condition: visit?.condition,
        symptoms: visit?.symptoms,
        doctorId: visit?.doctor?.id,
        paravetId: visit?.paravet?.id,
        adminId: visit?.admin?.id,
        groomerId: visit?.groomer?.id,
        products: Array.isArray(visit?.productUsages)
          ? visit.productUsages.map((pu: any) => ({ productName: pu.productName, quantity: pu.quantity }))
          : [],
        mixes: Array.isArray(visit?.mixUsages)
          ? visit.mixUsages.map((mu: any) => ({
              name: mu.mixProduct?.name,
              price: mu.unitPrice ?? mu.mixProduct?.price,
              quantity: mu.quantity,
              components: Array.isArray(mu.components)
                ? mu.components.map((c: any) => ({ productId: c.productId, quantity: c.quantity }))
                : Array.isArray(mu.mixProduct?.components)
                  ? mu.mixProduct.components.map((mc: any) => ({
                      productId: mc.productId,
                      quantityBase: mc.quantityBase,
                    }))
                  : [],
            }))
          : [],
      }
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Edit Visit #{visitId} • Booking #{id}
        </h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/bookings/${id}/visit/history`}>Kembali ke Riwayat Visit</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/dashboard/bookings/${id}`}>Detail Booking</Link>
          </Button>
        </div>
      </div>

      {!visit || !bp ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Visit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-sm">Visit tidak ditemukan</div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          <div className="text-sm font-medium">{bp?.pet?.name}</div>
          <Tabs defaultValue="form" className="w-full">
            <TabsList>
              <TabsTrigger value="form">Form Edit</TabsTrigger>
              <TabsTrigger value="history">Riwayat Visit</TabsTrigger>
            </TabsList>
            <TabsContent value="form">
              <VisitForm
                bookingId={Number(id)}
                bookingPetId={bp.id}
                ownerName={booking?.owner?.name}
                petName={bp?.pet?.name}
                minDate={min}
                maxDate={max}
                booking={booking}
                initial={initial as any}
                editVisitId={Number(visitId)}
                existingMixUsageIds={existingMixUsageIds}
              />
            </TabsContent>
            <TabsContent value="history">
              <VisitHistory
                bookingId={Number(id)}
                visits={Array.isArray(bp?.visits) ? bp.visits : []}
                items={Array.isArray(booking?.items) ? booking.items : []}
              />
            </TabsContent>
            {null}
          </Tabs>
        </div>
      )}
    </div>
  );
}
