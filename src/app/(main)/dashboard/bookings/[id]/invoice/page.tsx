import { headers } from "next/headers";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { PrintButton } from "./_components/print-button";

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
export default async function BookingInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await fetchJSON(`/api/bookings/${id}`);
  const estimate = await fetchJSON(`/api/bookings/${id}/billing/estimate`);
  const deposits = await fetchJSON(`/api/bookings/${id}/deposits`);
  const depositSum = Array.isArray(deposits)
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold">Invoice Booking #{id}</div>
            <div className="text-muted-foreground text-sm">Status: {booking?.status ?? "-"}</div>
          </div>
          <div className="text-right text-sm">
            <div>Tanggal: {new Date().toLocaleString()}</div>
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
          <div className="flex items-center justify-between">
            <div>Total Daily</div>
            <div>Rp {Number(estimate?.totalDaily ?? 0).toLocaleString("id-ID")}</div>
          </div>
          <div className="flex items-center justify-between">
            <div>Daily Charges</div>
            <div>Rp {Number(estimate?.totalDailyCharges ?? 0).toLocaleString("id-ID")}</div>
          </div>
          <div className="flex items-center justify-between">
            <div>Total Products</div>
            <div>Rp {Number(estimate?.totalProducts ?? 0).toLocaleString("id-ID")}</div>
          </div>
          <div className="flex items-center justify-between font-medium">
            <div>Total</div>
            <div>Rp {Number(estimate?.total ?? 0).toLocaleString("id-ID")}</div>
          </div>
          <div className="flex items-center justify-between">
            <div>Deposit</div>
            <div>Rp {Number(depositSum ?? 0).toLocaleString("id-ID")}</div>
          </div>
          <div className="flex items-center justify-between text-base font-semibold">
            <div>Sisa Tagihan</div>
            <div>Rp {Number(estimate?.amountDue ?? 0).toLocaleString("id-ID")}</div>
          </div>
        </div>
        <div className="bg-border my-6 h-px w-full" />
        <div className="text-muted-foreground text-xs">
          Dokumen ini dapat dicetak sebagai PDF melalui menu &quot;Unduh PDF&quot;.
        </div>
      </div>
    </div>
  );
}
