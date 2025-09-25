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
  const invoice = await fetchJSON(`/api/bookings/${id}/billing/invoice`);
  // Aggregate staff names across exams/visits
  const staffAgg = (() => {
    const names = {
      doctor: new Set<string>(),
      paravet: new Set<string>(),
      admin: new Set<string>(),
      groomer: new Set<string>(),
    };
    const pets = Array.isArray(booking?.pets) ? booking.pets : [];
    for (const bp of pets) {
      const exams = Array.isArray(bp?.examinations) ? bp.examinations : [];
      const visits = Array.isArray(bp?.visits) ? bp.visits : [];
      for (const ex of exams) {
        if (ex?.doctor?.name) names.doctor.add(ex.doctor.name);
        if (ex?.paravet?.name) names.paravet.add(ex.paravet.name);
        if (ex?.admin?.name) names.admin.add(ex.admin.name);
        if (ex?.groomer?.name) names.groomer.add(ex.groomer.name);
      }
      for (const v of visits) {
        if (v?.doctor?.name) names.doctor.add(v.doctor.name);
        if (v?.paravet?.name) names.paravet.add(v.paravet.name);
        if (v?.admin?.name) names.admin.add(v.admin.name);
        if (v?.groomer?.name) names.groomer.add(v.groomer.name);
      }
    }
    const toLine = (lab: string, set: Set<string>) => (set.size ? `${lab}: ${Array.from(set).join(", ")}` : null);
    return [
      toLine("Dokter", names.doctor),
      toLine("Paravet", names.paravet),
      toLine("Admin", names.admin),
      toLine("Groomer", names.groomer),
    ].filter(Boolean);
  })();
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
              <div className="text-muted-foreground text-xs">Invoice Booking #{id}</div>
            </div>
          </div>
          <div className="text-right text-sm">
            <div>Tanggal: {new Date().toLocaleString()}</div>
            <div className="text-muted-foreground">Status: {booking?.status ?? "-"}</div>
            <div className="mt-1 grid gap-0.5">
              {staffAgg.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
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
          {null}
          <div className="flex items-center justify-between">
            <div>Total Products</div>
            <div>Rp {Number(estimate?.totalProducts ?? 0).toLocaleString("id-ID")}</div>
          </div>
          <div className="flex items-center justify-between">
            <div>Diskon</div>
            <div>
              {invoice?.discountPercent ? (
                <>
                  {Number(invoice.discountPercent)}% (Rp {Number(invoice.discountAmount ?? 0).toLocaleString("id-ID")})
                </>
              ) : (
                <span>-</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between font-medium">
            <div>Total</div>
            <div>Rp {Number(invoice?.discountedTotal ?? estimate?.total ?? 0).toLocaleString("id-ID")}</div>
          </div>
          <div className="flex items-center justify-between">
            <div>Deposit</div>
            <div>Rp {Number(depositSum ?? 0).toLocaleString("id-ID")}</div>
          </div>
        </div>
        <div className="bg-border my-6 h-px w-full" />
        {/* Ringkasan detail layanan & staff */}
        <div className="grid gap-3 text-sm">
          <div className="font-medium">Detail Layanan</div>
          {Array.isArray(booking?.pets) && booking.pets.length ? (
            booking.pets.map((bp: any) => (
              <div key={bp.id} className="rounded-md border p-3">
                <div className="mb-1 text-xs font-semibold">{bp.pet?.name ?? `Pet #${bp.id}`}</div>
                {bp.examinations?.length ? (
                  <div className="mb-2 grid gap-1 text-xs">
                    {bp.examinations.map((ex: any, idx: number) => (
                      <div key={ex.id ?? idx} className="grid gap-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">Pemeriksaan</div>
                          <div className="text-muted-foreground">{new Date(ex.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="text-muted-foreground">
                          Dok:{ex.doctor?.name ?? "-"} · Prv:{ex.paravet?.name ?? "-"} · Adm:{ex.admin?.name ?? "-"}·
                          Grm:{ex.groomer?.name ?? "-"}
                        </div>
                        {Array.isArray(ex.productUsages) && ex.productUsages.length ? (
                          <div>
                            {ex.productUsages.map((pu: any, i: number) => (
                              <div key={i} className="flex items-center justify-between">
                                <div>
                                  {pu.productName} × {pu.quantity}
                                </div>
                                <div>Rp {Number(pu.unitPrice ?? 0).toLocaleString("id-ID")}</div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
                {bp.visits?.length ? (
                  <div className="grid gap-1 text-xs">
                    {bp.visits.map((v: any, idx: number) => {
                      const prod = Array.isArray(v.productUsages) ? v.productUsages : [];
                      const mix = Array.isArray(v.mixUsages) ? v.mixUsages : [];
                      const total =
                        prod.reduce((s: number, pu: any) => s + Number(pu.quantity) * Number(pu.unitPrice ?? 0), 0) +
                        mix.reduce(
                          (s: number, mu: any) =>
                            s + Number(mu.quantity) * Number(mu.unitPrice ?? mu.mixProduct?.price ?? 0),
                          0,
                        );
                      return (
                        <div key={v.id ?? idx} className="grid gap-1">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">Visit</div>
                            <div className="text-muted-foreground">{new Date(v.visitDate).toLocaleDateString()}</div>
                          </div>
                          <div className="text-muted-foreground">
                            Dok:{v.doctor?.name ?? "-"} · Prv:{v.paravet?.name ?? "-"} · Adm:{v.admin?.name ?? "-"} ·
                            Grm:{v.groomer?.name ?? "-"}
                          </div>
                          {prod.length ? (
                            <div>
                              {prod.map((pu: any, i: number) => (
                                <div key={i} className="flex items-center justify-between">
                                  <div>
                                    {pu.productName} × {pu.quantity}
                                  </div>
                                  <div>Rp {Number(pu.unitPrice ?? 0).toLocaleString("id-ID")}</div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                          {mix.length ? (
                            <div>
                              {mix.map((mu: any, i: number) => (
                                <div key={i} className="flex items-center justify-between">
                                  <div>
                                    {mu.mixProduct?.name ?? `Mix#${mu.mixProductId}`} × {Number(mu.quantity)}
                                  </div>
                                  <div>
                                    Rp {Number(mu.unitPrice ?? mu.mixProduct?.price ?? 0).toLocaleString("id-ID")}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                          <div className="text-right font-medium">Rp {Number(total).toLocaleString("id-ID")}</div>
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
