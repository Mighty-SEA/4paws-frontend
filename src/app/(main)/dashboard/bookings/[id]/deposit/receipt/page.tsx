import { headers } from "next/headers";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { PrintButton } from "../../invoice/_components/print-button";

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

export default async function DepositReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await fetchJSON(`/api/bookings/${id}`);
  const deposits = (await fetchJSON(`/api/bookings/${id}/deposits`)) ?? [];
  const totalDeposit = Array.isArray(deposits)
    ? deposits.reduce((sum: number, d: any) => sum + Number(d.amount ?? 0), 0)
    : 0;
  return (
    <div className="bg-background m-auto max-w-3xl p-6 print:p-0">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Button asChild variant="outline">
          <Link href={`/dashboard/bookings/${id}`}>Kembali</Link>
        </Button>
        <PrintButton />
      </div>
      <div className="rounded-md border p-6">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img src="/android-chrome-512x512.png" alt="logo" className="h-10 w-auto" />
            <div>
              <div className="text-xl font-semibold">4Paws Pet Care</div>
              <div className="text-muted-foreground text-xs">Bukti Deposit Booking #{id}</div>
            </div>
          </div>
          <div className="text-right text-sm">
            <div>Tanggal: {new Date().toLocaleString()}</div>
            <div className="text-muted-foreground">Status: {booking?.status ?? "-"}</div>
          </div>
        </div>
        <div className="grid gap-1 text-sm">
          <div>Owner: {booking?.owner?.name ?? "-"}</div>
          <div>Telepon: {booking?.owner?.phone ?? "-"}</div>
          <div>Service: {booking?.serviceType?.service?.name ?? "-"}</div>
          <div>Type: {booking?.serviceType?.name ?? "-"}</div>
          <div>Start: {booking?.startDate ? new Date(booking.startDate).toLocaleDateString() : "-"}</div>
          <div>End: {booking?.endDate ? new Date(booking.endDate).toLocaleDateString() : "-"}</div>
        </div>
        <div className="bg-border my-6 h-px w-full" />
        <div className="grid gap-2 text-sm">
          <div className="font-medium">Rincian Deposit</div>
          {Array.isArray(deposits) && deposits.length ? (
            <div className="grid gap-1">
              {deposits.map((d: any) => (
                <div key={d.id} className="grid grid-cols-3 items-center gap-2 rounded-md border p-2 text-xs">
                  <div className="col-span-2">{new Date(d.depositDate).toLocaleString()}</div>
                  <div className="text-right">Rp {Number(d.amount ?? 0).toLocaleString("id-ID")}</div>
                  <div className="text-muted-foreground col-span-3">Metode: {d.method ?? "-"}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-xs">Belum ada deposit</div>
          )}
          <div className="flex items-center justify-between font-medium">
            <div>Total Deposit</div>
            <div>Rp {Number(totalDeposit ?? 0).toLocaleString("id-ID")}</div>
          </div>
        </div>
        <div className="bg-border my-6 h-px w-full" />
        <div className="text-muted-foreground text-xs">
          Dokumen ini adalah bukti setoran/deposit untuk booking terkait.
        </div>
      </div>
    </div>
  );
}
