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
          <div className="flex items-center gap-3">
            <img src="/android-chrome-512x512.png" alt="logo" className="h-10 w-auto" />
            <div>
              <div className="text-xl font-semibold">4Paws Pet Care</div>
              <div className="text-muted-foreground text-xs">Invoice Booking #{id}</div>
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
        {/* Ringkasan ringkas layanan & staff */}
        <div className="grid gap-3 text-sm">
          <div className="font-medium">Ringkasan Layanan</div>
          {Array.isArray(booking?.pets) && booking.pets.length ? (
            booking.pets.map((bp: any) => (
              <div key={bp.id} className="rounded-md border p-3">
                <div className="mb-1 text-xs font-semibold">{bp.pet?.name ?? `Pet #${bp.id}`}</div>
                {bp.examinations?.length ? (
                  <div className="mb-2 grid gap-1 text-xs">
                    {bp.examinations.map((ex: any, idx: number) => (
                      <div key={ex.id ?? idx} className="flex items-center justify-between">
                        <div>
                          Pemeriksaan • Dok:{ex.doctor?.name ?? "-"} · Prv:{ex.paravet?.name ?? "-"} · Adm:
                          {ex.admin?.name ?? "-"} · Grm:{ex.groomer?.name ?? "-"}
                        </div>
                        <div className="text-muted-foreground">{new Date(ex.createdAt).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                ) : null}
                {bp.visits?.length ? (
                  <div className="grid gap-1 text-xs">
                    {bp.visits.map((v: any, idx: number) => {
                      const prod = Array.isArray(v.productUsages) ? v.productUsages : [];
                      const mix = Array.isArray(v.mixUsages) ? v.mixUsages : [];
                      const lines = [
                        ...prod.map((pu: any) => `${pu.productName} x${pu.quantity}`),
                        ...mix.map((mu: any) => `${mu.mixProduct?.name ?? `Mix#${mu.mixProductId}`} x${mu.quantity}`),
                      ];
                      const summary = lines.slice(0, 3).join(", ") + (lines.length > 3 ? ", ..." : "");
                      const total =
                        prod.reduce((s: number, pu: any) => s + Number(pu.quantity) * Number(pu.unitPrice ?? 0), 0) +
                        mix.reduce(
                          (s: number, mu: any) =>
                            s + Number(mu.quantity) * Number(mu.unitPrice ?? mu.mixProduct?.price ?? 0),
                          0,
                        );
                      return (
                        <div key={v.id ?? idx} className="flex items-center justify-between">
                          <div>
                            Visit • Dok:{v.doctor?.name ?? "-"} · Prv:{v.paravet?.name ?? "-"} · Adm:
                            {v.admin?.name ?? "-"} · Grm:{v.groomer?.name ?? "-"} — {summary}
                          </div>
                          <div>Rp {Number(total).toLocaleString("id-ID")}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="text-muted-foreground text-xs">Tidak ada data item</div>
          )}
        </div>
        <div className="bg-border my-6 h-px w-full" />
        <div className="text-muted-foreground text-xs">
          Dokumen ini dapat dicetak sebagai PDF melalui menu &quot;Unduh PDF&quot;.
        </div>
      </div>
    </div>
  );
}
