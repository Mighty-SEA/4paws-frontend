"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { ExamForm } from "./exam-form";
import { ProceedToDepositButton } from "./proceed-to-deposit-button";

type Pet = { id: number; name?: string };

export function ExaminationFormsGroup({
  bookingId,
  pets,
  initialByBookingPetId,
  isGroomingService,
  isPerDay,
}: {
  bookingId: number;
  pets: Pet[];
  initialByBookingPetId?: Record<
    number,
    {
      weight?: string | number;
      temperature?: string | number;
      notes?: string;
      products?: Array<{ productName: string; quantity: string | number }>;
      mixes?: Array<{
        name?: string;
        price?: string | number;
        quantity?: string | number;
        components: Array<{ productId: number | string; quantityBase: string | number }>;
      }>;
    }
  >;
  isGroomingService?: boolean;
  isPerDay?: boolean;
}) {
  const router = useRouter();
  const submitters = React.useRef<Array<() => Promise<boolean>>>([]);
  submitters.current = [];

  function register(fn: () => Promise<boolean>) {
    submitters.current.push(fn);
  }

  async function saveAll() {
    if (!submitters.current.length) return;
    const results = await Promise.all(submitters.current.map((fn) => fn()));
    const ok = results.every(Boolean);
    if (ok) {
      toast.success("Pemeriksaan tersimpan");
      router.push(`/dashboard/bookings`);
    }
  }

  return (
    <div className="grid gap-4">
      {pets.map((p) => (
        <div key={p.id} className="grid gap-2">
          <div className="text-sm font-medium">{p.name ?? `Pet #${p.id}`}</div>
          <ExamForm
            bookingId={bookingId}
            bookingPetId={p.id}
            initial={initialByBookingPetId?.[p.id]}
            externalControls
            register={register}
          />
        </div>
      ))}
      <div className="flex items-center justify-end gap-2">
        {isPerDay ? <ProceedToDepositButton bookingId={bookingId} /> : null}
        <Button onClick={saveAll}>Simpan Pemeriksaan</Button>
      </div>
    </div>
  );
}
