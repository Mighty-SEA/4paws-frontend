"use client";

import * as React from "react";

import dynamic from "next/dynamic";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { BookingItems } from "./booking-items";
import { BookingSummary } from "./booking-summary";
import { CheckoutButton } from "./checkout-button";
import { SplitBooking } from "./split-booking";
import { StandaloneItems } from "./standalone-items";

// Lazy load heavy components
const ExaminationHistory = dynamic(
  () => import("./examination-history").then((m) => ({ default: m.ExaminationHistory })),
  {
    loading: () => (
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pemeriksaan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">Memuat...</div>
        </CardContent>
      </Card>
    ),
    ssr: false,
  },
);

type BookingDetailWrapperProps = {
  id: string;
  summary: any;
  deposits: any;
  estimate: any;
  payments: any;
  invoice: any;
};

export function BookingDetailWrapper({
  id,
  summary,
  deposits,
  estimate,
  payments,
  invoice,
}: BookingDetailWrapperProps) {
  const totalDeposit = Array.isArray(deposits)
    ? deposits.reduce((sum: number, d: any) => sum + Number(d.amount ?? 0), 0)
    : 0;
  const items = Array.isArray(summary?.items) ? summary.items : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Booking #{id}</h1>
        <div className="flex gap-2">
          {summary?.status === "COMPLETED" ? (
            <Button asChild variant="outline">
              <Link href={`/dashboard/bookings/${id}/invoice`}>Unduh Invoice</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href="/dashboard/bookings">Back</Link>
          </Button>
        </div>
      </div>

      {/* Summary Card - Fast load with summary endpoint */}
      <BookingSummary booking={summary} estimate={estimate} invoice={invoice} />

      {/* ADDON Section */}
      <Card>
        <CardHeader>
          <CardTitle>ADDON Tambahan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <BookingItems bookingId={Number(id)} items={items} />
        </CardContent>
      </Card>

      {/* Standalone Items per Pet */}
      <Card>
        <CardHeader>
          <CardTitle>Item Tambahan per Pet</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {Array.isArray(summary?.pets) && summary.pets.length ? (
            summary.pets.map((bp: any) => (
              <div key={bp.id} className="rounded-md border p-2">
                <div className="mb-2 text-sm font-medium">{bp.pet?.name ?? "Pet"}</div>
                <StandaloneItems bookingId={Number(id)} bookingPetId={bp.id} />
              </div>
            ))
          ) : (
            <div className="text-muted-foreground text-sm">Tidak ada pet</div>
          )}
        </CardContent>
      </Card>

      {/* Deposit Section */}
      {summary?.serviceType?.pricePerDay && summary?.proceedToAdmission ? (
        <Card>
          <CardHeader className="flex items-center justify-between gap-2 md:flex-row">
            <CardTitle>Deposit</CardTitle>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/bookings/${id}/deposit/receipt`}>Cetak Bukti Deposit</Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link href={`/dashboard/bookings/${id}/deposit`}>Tambah Deposit</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div>Total Deposit: Rp {totalDeposit.toLocaleString("id-ID")}</div>
            {Array.isArray(deposits) && deposits.length ? (
              <div className="grid gap-1">
                {deposits.map((d: any) => (
                  <div key={d.id} className="rounded-md border p-2 text-xs">
                    <div>{new Date(d.depositDate).toLocaleString()}</div>
                    <div>Jumlah: Rp {Number(d.amount ?? 0).toLocaleString("id-ID")}</div>
                    <div>Metode: {d.method ?? "-"}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-xs">Belum ada deposit</div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Payments Section */}
      {Array.isArray(payments) && payments.length ? (
        <Card>
          <CardHeader className="flex items-center justify-between gap-2 md:flex-row">
            <CardTitle>Pembayaran</CardTitle>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/bookings/${id}/invoice`}>Invoice</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {payments.map((p: any) => (
              <div key={p.id} className="rounded-md border p-2 text-xs">
                <div>{new Date(p.paymentDate).toLocaleString()}</div>
                <div>Jumlah: Rp {Number(p.total ?? 0).toLocaleString("id-ID")}</div>
                <div>Metode: {p.method ?? "-"}</div>
                <div>Invoice: {p.invoiceNo ?? "-"}</div>
                {p.discountPercent ? (
                  <div>
                    Diskon: {Number(p.discountPercent)}% (Rp {Number(p.discountAmount ?? 0).toLocaleString("id-ID")})
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Checkout Button */}
      {summary?.status !== "COMPLETED" && Number(estimate?.amountDue ?? 0) > 0 ? (
        <div className="flex justify-end">
          <CheckoutButton bookingId={Number(id)} label="Bayar" items={[]} />
        </div>
      ) : null}

      {/* Examination History - Lazy Loaded */}
      <ExaminationHistory bookingId={Number(id)} />

      {/* Pets List */}
      {(() => {
        const svcName = String(summary?.serviceType?.service?.name ?? "");
        const typeName = String(summary?.serviceType?.name ?? "");
        const isPetshop = /petshop/i.test(svcName) || /petshop/i.test(typeName);
        if (isPetshop) return null;
        const pets = Array.isArray(summary?.pets) ? summary.pets : [];
        const realPets = pets.filter((bp: any) => String(bp?.pet?.name ?? "").toLowerCase() !== "petshop");
        return (
          <Card>
            <CardHeader>
              <CardTitle>Pets</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {realPets.length ? (
                realPets.map((bp: { id: number; pet?: { name?: string } }) => (
                  <div key={bp.id} className="rounded-md border p-2 text-sm">
                    {bp.pet?.name}
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground text-sm">Tidak ada pet</div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Split Booking */}
      {Array.isArray(summary?.pets) && summary.pets.length > 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Pisahkan Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <SplitBooking
              bookingId={Number(id)}
              pets={summary.pets.map((bp: any) => ({ id: bp.pet?.id, name: bp.pet?.name }))}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
