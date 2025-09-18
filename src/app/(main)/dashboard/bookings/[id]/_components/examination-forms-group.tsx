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
  const submittersRef = React.useRef<Map<number,() => Promise<boolean>>>(new Map());

  function registerSubmitter(key: number, fn: () => Promise<boolean>) {
    submittersRef.current.set(key, fn);
  }

  async function submitAll(): Promise<{ ok: boolean; failures: number }> {
    const fns = Array.from(submittersRef.current.values());
    if (!fns.length) return { ok: true, failures: 0 };
    let failures = 0;
    for (const fn of fns) {
      const ok = await fn();
      if (!ok) failures += 1;
    }
    return { ok: failures === 0, failures };
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
            register={perDay ? (fn) => registerSubmitter(p.id, fn) : undefined}
            initial={initialByBookingPetId?.[p.id]}
          />
        </div>
      ))}
      {perDay ? (
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              const result = await submitAll();
              // Tetap lanjut ke deposit, tapi jika ada gagal biar user tahu dari toast per form
              await fetch(`/api/bookings/${bookingId}`, { method: "PATCH" });
              router.push(`/dashboard/bookings/${bookingId}/deposit`);
            }}
          >
            Lanjutkan ke Deposit
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              const result = await submitAll();
              await fetch(`/api/bookings/${bookingId}/billing/checkout`, { method: "POST" });
              router.push(`/dashboard/bookings`);
            }}
          >
            Selesai
          </Button>
        </div>
      ) : null}
    </div>
  );
}
