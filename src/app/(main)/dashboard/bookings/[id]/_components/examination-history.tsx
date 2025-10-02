"use client";

import * as React from "react";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ExaminationHistoryProps = {
  bookingId: number;
};

export function ExaminationHistory({ bookingId }: ExaminationHistoryProps) {
  const [booking, setBooking] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadBookingDetails() {
      setLoading(true);
      try {
        const res = await fetch(`/api/bookings/${bookingId}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setBooking(data);
        }
      } catch (error) {
        console.error("Failed to load booking details:", error);
      } finally {
        setLoading(false);
      }
    }
    void loadBookingDetails();
  }, [bookingId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pemeriksaan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">Memuat riwayat...</div>
        </CardContent>
      </Card>
    );
  }

  const svcName = String(booking?.serviceType?.service?.name ?? "");
  const typeName = String(booking?.serviceType?.name ?? "");
  const isPetshop = /petshop/i.test(svcName) || /petshop/i.test(typeName);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Riwayat {isPetshop ? "Pemesanan" : "Pemeriksaan"}</CardTitle>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/bookings/${bookingId}/visit/form`}>Form Visit</Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link href={`/dashboard/bookings/${bookingId}/visit/history`}>Riwayat Visit</Link>
          </Button>
        </div>
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
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>{new Date(ex.createdAt ?? ex.updatedAt ?? Date.now()).toLocaleString()}</div>
                        <div className="text-muted-foreground">
                          Dokter: {ex.doctor?.name ?? "-"} · Paravet: {ex.paravet?.name ?? "-"} · Admin:{" "}
                          {ex.admin?.name ?? "-"} · Groomer: {ex.groomer?.name ?? "-"}
                        </div>
                      </div>
                      <div className="mt-1">
                        W: {ex.weight ?? "-"} kg, T: {ex.temperature ?? "-"} °C
                      </div>
                      {ex.chiefComplaint ? <div>Keluhan: {ex.chiefComplaint}</div> : null}
                      {ex.additionalNotes ? <div>Catatan Tambahan: {ex.additionalNotes}</div> : null}
                      {ex.diagnosis ? <div>Diagnosis: {ex.diagnosis}</div> : null}
                      {ex.prognosis ? <div>Prognosis: {ex.prognosis}</div> : null}
                      <div>Catatan: {ex.notes ?? "-"}</div>
                      {ex.productUsages?.length ? (
                        <div>
                          Produk: {ex.productUsages.map((pu: any) => `${pu.productName} (${pu.quantity})`).join(", ")}
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground text-xs">
                    Belum ada {isPetshop ? "pemesanan" : "pemeriksaan"}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-muted-foreground text-sm">Tidak ada pet</div>
        )}
      </CardContent>
    </Card>
  );
}
