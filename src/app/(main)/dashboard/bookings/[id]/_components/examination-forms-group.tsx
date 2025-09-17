"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { ExamForm } from "./exam-form";

type Pet = { id: number; name?: string };

export function ExaminationFormsGroup({
  bookingId,
  perDay,
  pets,
  initialByBookingPetId,
}: {
  bookingId: number;
  perDay: boolean;
  pets: Pet[];
  initialByBookingPetId?: Record<
    number,
    {
      weight?: string | number;
      temperature?: string | number;
      notes?: string;
      products?: Array<{ productName: string; quantity: string | number }>;
      mixes?: Array<{ mixProductId: string | number; quantity: string | number }>;
    }
  >;
}) {
  const router = useRouter();
  const submittersRef = React.useRef<Array<() => Promise<boolean>>>([]);

  function registerSubmitter(fn: () => Promise<boolean>) {
    submittersRef.current.push(fn);
  }

  async function submitAll(): Promise<boolean> {
    const fns = submittersRef.current;
    if (!fns.length) return true;
    for (const fn of fns) {
      const ok = await fn();
      if (!ok) return false;
    }
    return true;
  }

  return (
    <div className="grid gap-4">
      {pets.map((p) => (
        <div key={p.id} className="grid gap-2">
          <div className="text-sm font-medium">{p.name ?? `Pet #${p.id}`}</div>
          <ExamForm
            bookingId={bookingId}
            bookingPetId={p.id}
            mode={perDay ? "perDay" : "default"}
            externalControls={perDay}
            register={perDay ? registerSubmitter : undefined}
            initial={initialByBookingPetId?.[p.id]}
          />
        </div>
      ))}
      {perDay ? (
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              const ok = await submitAll();
              if (ok) {
                await fetch(`/api/bookings/${bookingId}`, { method: "PATCH" });
                router.push(`/dashboard/bookings/${bookingId}/deposit`);
              }
            }}
          >
            Lanjutkan ke Deposit
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              const ok = await submitAll();
              if (ok) {
                await fetch(`/api/bookings/${bookingId}/billing/checkout`, { method: "POST" });
                router.push(`/dashboard/bookings`);
              }
            }}
          >
            Selesai
          </Button>
        </div>
      ) : null}
    </div>
  );
}
