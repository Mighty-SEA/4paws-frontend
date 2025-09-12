/* eslint-disable complexity */
/* eslint-disable import/order */
import { headers } from "next/headers";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ProceedToDepositButton } from "../_components/proceed-to-deposit-button";
import { ExamForm } from "../_components/exam-form";

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
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {booking?.serviceType?.pricePerDay ? "Periksa Pra Ranap" : "Pemeriksaan"} Booking #{id}
        </h1>
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
        <div className="grid gap-4">
          {booking.pets.map((bp: any) => (
            <div key={bp.id} className="grid gap-2">
              <div className="text-sm font-medium">{bp.pet?.name}</div>
              {/* List hasil pemeriksaan sebelumnya */}
              <div className="grid gap-2">
                {bp.examinations?.length ? (
                  bp.examinations.map((ex: any) => (
                    <div key={ex.id} className="rounded-md border p-2 text-xs">
                      <div>
                        W: {ex.weight ?? "-"} kg, T: {ex.temperature ?? "-"} °C
                      </div>
                      <div>Notes: {ex.notes ?? "-"}</div>
                      {ex.productUsages?.length ? (
                        <div>
                          Products: {ex.productUsages.map((pu: any) => `${pu.productName} (${pu.quantity})`).join(", ")}
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground text-xs">Belum ada pemeriksaan</div>
                )}
              </div>
              {booking?.serviceType?.pricePerDay || !booking?.pets?.some((p: any) => p.examinations?.length) ? (
                <ExamForm
                  bookingId={booking.id}
                  bookingPetId={bp.id}
                  mode={booking?.serviceType?.pricePerDay ? "perDay" : "default"}
                />
              ) : null}
              {/* Tombol aksi dikelola oleh ExamForm (Client Component) untuk menghindari duplikasi */}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground text-sm">Tidak ada pet pada booking ini</div>
      )}
    </div>
  );
}
