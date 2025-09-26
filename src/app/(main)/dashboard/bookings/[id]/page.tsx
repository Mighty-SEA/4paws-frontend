import { headers } from "next/headers";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { BookingItems } from "./_components/booking-items";
import { CheckoutButton } from "./_components/checkout-button";
import { SplitBooking } from "./_components/split-booking";
import { VisitHistory } from "./_components/visit-history";

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
export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await fetchJSON(`/api/bookings/${id}`);
  const deposits = await fetchJSON(`/api/bookings/${id}/deposits`);
  const totalDeposit = Array.isArray(deposits)
    ? deposits.reduce((sum: number, d: any) => sum + Number(d.amount ?? 0), 0)
    : 0;
  const estimate = await fetchJSON(`/api/bookings/${id}/billing/estimate`);
  const payments = await fetchJSON(`/api/bookings/${id}/payments`);
  const invoice = await fetchJSON(`/api/bookings/${id}/billing/invoice`);
  const discountPercent = Number(invoice?.discountPercent ?? 0);
  const discountAmount = Number(invoice?.discountAmount ?? 0);
  const items = Array.isArray(booking?.items) ? booking.items : [];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Booking #{id}</h1>
        <div className="flex gap-2">
          {null}
          {booking?.status === "COMPLETED" ? (
            <Button asChild variant="outline">
              <Link href={`/dashboard/bookings/${id}/invoice`}>Unduh Invoice</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href="/dashboard/bookings">Back</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-3 text-sm">
              <div className="grid grid-cols-3 items-center gap-2">
                <div className="text-muted-foreground">Owner</div>
                <div className="col-span-2 text-base font-semibold">{booking?.owner?.name ?? "-"}</div>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <div className="text-muted-foreground">Status</div>
                <div className="col-span-2 font-medium">{booking?.status ?? "-"}</div>
              </div>
            </div>
            <div className="grid gap-3 text-sm">
              <div className="grid grid-cols-3 items-center gap-2">
                <div className="text-muted-foreground">Layanan</div>
                <div className="col-span-2 flex items-center gap-2">
                  <span className="font-semibold">{booking?.serviceType?.service?.name ?? "-"}</span>
                  {booking?.serviceType?.name ? <Badge variant="secondary">{booking.serviceType.name}</Badge> : null}
                </div>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <div className="text-muted-foreground">Periode</div>
                <div className="col-span-2">
                  {booking?.startDate ? new Date(booking.startDate).toLocaleDateString() : "-"} –{" "}
                  {booking?.endDate ? new Date(booking.endDate).toLocaleDateString() : "-"}
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-md border p-3">
            <div className="mb-2 text-sm font-medium">Ringkasan Biaya</div>
            <div className="grid grid-cols-2 gap-y-1 text-sm">
              <div className="text-muted-foreground">Jasa Layanan</div>
              <div className="text-right">Rp {Number(estimate?.baseService ?? 0).toLocaleString("id-ID")}</div>
              <div className="text-muted-foreground">Total Products</div>
              <div className="text-right">Rp {Number(estimate?.totalProducts ?? 0).toLocaleString("id-ID")}</div>
              <div className="text-muted-foreground">Diskon</div>
              <div className="text-right">
                {discountPercent ? `${discountPercent}% (Rp ${Number(discountAmount).toLocaleString("id-ID")})` : "-"}
              </div>
              <div className="text-muted-foreground">Total</div>
              <div className="text-right font-medium">
                Rp {Number(invoice?.discountedTotal ?? estimate?.total ?? 0).toLocaleString("id-ID")}
              </div>
              <div className="text-muted-foreground">Deposit</div>
              <div className="text-right">Rp {Number(estimate?.depositSum ?? 0).toLocaleString("id-ID")}</div>
              <div className="text-muted-foreground">Sisa Tagihan</div>
              <div className="text-right font-semibold">
                Rp {Number(invoice?.amountDue ?? estimate?.amountDue ?? 0).toLocaleString("id-ID")}
              </div>
            </div>
            <div className="mt-3 grid gap-1 text-xs">
              {(() => {
                const raw = (booking?.pets ?? []).flatMap((bp: any) => {
                  const examUsages = (bp.examinations ?? []).flatMap((ex: any) => ex.productUsages ?? []);
                  const visitProductUsages = (bp.visits ?? []).flatMap((v: any) => v.productUsages ?? []);
                  const visitMix = (bp.visits ?? []).flatMap((v: any) => v.mixUsages ?? []);
                  const standaloneMix = bp.mixUsages ?? [];
                  const uniqueMix = new Map<string | number, any>();
                  [...visitMix, ...standaloneMix].forEach((mu: any) => {
                    const key =
                      mu?.id ??
                      `${mu?.mixProductId}|${mu?.visitId ?? ""}|${mu?.createdAt ?? ""}|${mu?.quantity ?? ""}|${
                        mu?.unitPrice ?? ""
                      }`;
                    if (!uniqueMix.has(key)) uniqueMix.set(key, mu);
                  });
                  const mixRows = Array.from(uniqueMix.values()).map((mu: any) => ({
                    productName: mu.mixProduct?.name ?? `Mix#${mu.mixProductId}`,
                    quantity: mu.quantity,
                    unitPrice: mu.unitPrice ?? mu.mixProduct?.price ?? 0,
                  }));
                  return [...examUsages, ...visitProductUsages, ...mixRows];
                });
                const grouped = new Map<string, { productName: string; quantity: number; unitPrice: number }>();
                for (const it of raw) {
                  const key = `${it.productName}|${Number(it.unitPrice ?? 0)}`;
                  const prev = grouped.get(key) ?? {
                    productName: it.productName,
                    quantity: 0,
                    unitPrice: Number(it.unitPrice ?? 0),
                  };
                  prev.quantity = Number(prev.quantity) + Number(it.quantity ?? 0);
                  grouped.set(key, prev);
                }
                return Array.from(grouped.values()).map((pu, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      {pu.productName} <span className="text-muted-foreground">({pu.quantity})</span>
                    </div>
                    <div>Rp {Number(pu.unitPrice ?? 0).toLocaleString("id-ID")}</div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rincian lengkap: jasa (primary + addon), produk & mix */}
      <Card>
        <CardHeader>
          <CardTitle>Rincian Lengkap</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          {(() => {
            const svc = booking?.serviceType;
            const pets = Array.isArray(booking?.pets) ? booking.pets : [];
            const items = Array.isArray(booking?.items) ? booking.items : [];

            function normalizeDay(d?: string | Date | null) {
              if (!d) return undefined as unknown as Date;
              const x = new Date(d);
              x.setHours(0, 0, 0, 0);
              return x;
            }
            function calcDays(start?: Date, end?: Date) {
              if (!start || !end) return 0;
              const ms = 24 * 60 * 60 * 1000;
              const diff = Math.ceil((end.getTime() - start.getTime()) / ms);
              return Math.max(0, diff);
            }

            // Primary (implisit) baris
            const start = normalizeDay(booking?.startDate);
            const end = normalizeDay(booking?.endDate);
            const primaryPerDay = svc?.pricePerDay ? Number(svc.pricePerDay) : 0;
            const primaryFlat = svc?.price ? Number(svc.price) : 0;
            const primaryUnit = primaryPerDay ? primaryPerDay : primaryFlat;
            const primaryDays = primaryPerDay ? calcDays(start, end) : 0;
            const primaryPetFactor = primaryPerDay ? pets.length : 0;
            const primarySubtotal = primaryPerDay
              ? primaryDays * primaryUnit * Math.max(primaryPetFactor, 1)
              : // Non per-hari primary dihitung per hewan yang diperiksa (sesuai backend)
                (() => {
                  if (!primaryFlat) return 0;
                  const examinedCount = pets.reduce(
                    (cnt: number, bp: any) => cnt + ((bp.examinations?.length ?? 0) > 0 ? 1 : 0),
                    0,
                  );
                  return primaryFlat * examinedCount;
                })();

            // Addon rows
            const addonRows: {
              id: number | string;
              role?: string;
              name: string;
              serviceName: string;
              unit: number;
              qty: number;
              perDay: boolean;
              days: number;
              subtotal: number;
            }[] = items.map((it: any) => {
              const st = it?.serviceType ?? {};
              const perDay = st?.pricePerDay ? Number(st.pricePerDay) : 0;
              const flat = st?.price ? Number(st.price) : 0;
              const hasCustomUnit = it?.unitPrice !== undefined && it.unitPrice !== null && String(it.unitPrice) !== "";
              const unit = hasCustomUnit ? Number(it.unitPrice) : perDay ? perDay : flat;
              const s = normalizeDay(it?.startDate ?? booking?.startDate);
              const e = normalizeDay(it?.endDate ?? booking?.endDate);
              const qty = Number(it?.quantity ?? 1) || 1;
              const days = perDay ? calcDays(s, e) : 0;
              const subtotal = perDay ? unit * days * qty : unit * qty;
              return {
                id: it.id,
                role: it.role,
                name: st?.name ?? "-",
                serviceName: st?.service?.name ?? "-",
                unit,
                qty,
                perDay: !!perDay,
                days,
                subtotal,
              };
            });

            // Produk & Mix (agregat)
            const productLines = (() => {
              const raw = pets.flatMap((bp: any) => {
                const examUsages = (bp.examinations ?? []).flatMap((ex: any) => ex.productUsages ?? []);
                const visitProductUsages = (bp.visits ?? []).flatMap((v: any) => v.productUsages ?? []);
                const visitMix = (bp.visits ?? []).flatMap((v: any) => v.mixUsages ?? []);
                const standaloneMix = bp.mixUsages ?? [];
                const uniqueMix = new Map<string | number, any>();
                [...visitMix, ...standaloneMix].forEach((mu: any) => {
                  const key =
                    mu?.id ??
                    `${mu?.mixProductId}|${mu?.visitId ?? ""}|${mu?.createdAt ?? ""}|${mu?.quantity ?? ""}|${
                      mu?.unitPrice ?? ""
                    }`;
                  if (!uniqueMix.has(key)) uniqueMix.set(key, mu);
                });
                const mixRows = Array.from(uniqueMix.values()).map((mu: any) => ({
                  productName: mu.mixProduct?.name ?? `Mix#${mu.mixProductId}`,
                  quantity: mu.quantity,
                  unitPrice: mu.unitPrice ?? mu.mixProduct?.price ?? 0,
                }));
                return [...examUsages, ...visitProductUsages, ...mixRows];
              });
              const grouped = new Map<string, { productName: string; quantity: number; unitPrice: number }>();
              for (const it of raw) {
                const key = `${it.productName}|${Number(it.unitPrice ?? 0)}`;
                const prev = grouped.get(key) ?? {
                  productName: it.productName,
                  quantity: 0,
                  unitPrice: Number(it.unitPrice ?? 0),
                };
                prev.quantity = Number(prev.quantity) + Number(it.quantity ?? 0);
                grouped.set(key, prev);
              }
              return Array.from(grouped.values());
            })();

            return (
              <div className="grid gap-6">
                {/* Jasa: Primary + Addon */}
                <div className="grid gap-2">
                  <div className="text-sm font-medium">Jasa (Primary & Addon)</div>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-12 gap-2 p-2 text-xs font-medium">
                      <div className="col-span-5">Nama</div>
                      <div className="col-span-2 text-right">Harga</div>
                      <div className="col-span-2 text-right">Qty</div>
                      <div className="col-span-1 text-right">Hari</div>
                      <div className="col-span-2 text-right">Subtotal</div>
                    </div>
                    <div className="grid gap-1 p-2 text-sm">
                      <div className="grid grid-cols-12 items-center gap-2">
                        <div className="col-span-5">
                          <div className="font-medium">{svc?.service?.name ?? "-"}</div>
                          <div className="text-muted-foreground text-xs">{svc?.name ?? "Primary"}</div>
                        </div>
                        <div className="col-span-2 text-right">Rp {Number(primaryUnit).toLocaleString("id-ID")}</div>
                        <div className="col-span-2 text-right">
                          {primaryPerDay ? pets.length : /* qty per hewan diperiksa */ 1}
                        </div>
                        <div className="col-span-1 text-right">{primaryPerDay ? primaryDays : 0}</div>
                        <div className="col-span-2 text-right">
                          Rp {Number(primarySubtotal).toLocaleString("id-ID")}
                        </div>
                      </div>
                      {addonRows.length ? (
                        addonRows.map((it) => (
                          <div key={it.id} className="grid grid-cols-12 items-center gap-2">
                            <div className="col-span-5">
                              <div className="font-medium">{it.name}</div>
                              <div className="text-muted-foreground text-xs">
                                {it.serviceName} · {it.role}
                              </div>
                            </div>
                            <div className="col-span-2 text-right">Rp {Number(it.unit).toLocaleString("id-ID")}</div>
                            <div className="col-span-2 text-right">{it.qty}</div>
                            <div className="col-span-1 text-right">{it.perDay ? it.days : 0}</div>
                            <div className="col-span-2 text-right">
                              Rp {Number(it.subtotal).toLocaleString("id-ID")}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-muted-foreground text-xs">Tidak ada addon</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Produk & Mix (Item + Sub-item untuk komponen Mix) */}
                <div className="grid gap-2">
                  <div className="text-sm font-medium">Produk & Mix</div>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-12 gap-2 p-2 text-xs font-medium">
                      <div className="col-span-7">Nama</div>
                      <div className="col-span-2 text-right">Harga</div>
                      <div className="col-span-1 text-right">Qty</div>
                      <div className="col-span-2 text-right">Subtotal</div>
                    </div>
                    <div className="grid gap-1 p-2 text-sm">
                      {(() => {
                        // Bangun daftar item rinci termasuk MIX dengan sub-komponen
                        const pets = Array.isArray(booking?.pets) ? booking.pets : [];
                        type Line = {
                          key: string | number;
                          name: string;
                          unitPrice: number;
                          quantity: number;
                          components?: Array<{ name: string; qty: number }>;
                        };
                        const lines: Line[] = [];
                        pets.forEach((bp: any) => {
                          const examUsages = (bp.examinations ?? []).flatMap((ex: any) => ex.productUsages ?? []);
                          const visitProductUsages = (bp.visits ?? []).flatMap((v: any) => v.productUsages ?? []);
                          const visitMix = (bp.visits ?? []).flatMap((v: any) => v.mixUsages ?? []);
                          const standaloneMix = bp.mixUsages ?? [];
                          examUsages.forEach((pu: any, i: number) =>
                            lines.push({
                              key: `EX-${exAMKey(pu, i)}`,
                              name: String(pu.productName ?? "Produk"),
                              unitPrice: Number(pu.unitPrice ?? 0),
                              quantity: Number(pu.quantity ?? 0),
                            }),
                          );
                          visitProductUsages.forEach((pu: any, i: number) =>
                            lines.push({
                              key: `VP-${pu.id ?? i}`,
                              name: String(pu.productName ?? "Produk"),
                              unitPrice: Number(pu.unitPrice ?? 0),
                              quantity: Number(pu.quantity ?? 0),
                            }),
                          );
                          const uniqMix = new Map<string | number, any>();
                          [...visitMix, ...standaloneMix].forEach((mu: any) => {
                            const key = mu?.id ?? `${mu?.mixProductId}|${mu?.visitId ?? ""}|${mu?.createdAt ?? ""}`;
                            if (!uniqMix.has(key)) uniqMix.set(key, mu);
                          });
                          Array.from(uniqMix.values()).forEach((mu: any) => {
                            const comps = (mu.mixProduct?.components ?? []).map((c: any) => ({
                              name: c?.product?.name ?? String(c.productId ?? "Komponen"),
                              qty: Number(c?.quantityBase ?? 0),
                            }));
                            lines.push({
                              key: mu.id ?? `${mu.mixProductId}-${mu.visitId ?? ""}`,
                              name: mu.mixProduct?.name ?? `Mix#${mu.mixProductId}`,
                              unitPrice: Number(mu.unitPrice ?? mu.mixProduct?.price ?? 0),
                              quantity: Number(mu.quantity ?? 0),
                              components: comps.length ? comps : undefined,
                            });
                          });
                        });

                        function exAMKey(pu: any, i: number) {
                          return pu?.id ?? `${pu?.productName ?? ""}|${pu?.unitPrice ?? ""}|${i}`;
                        }

                        if (!lines.length) {
                          return <div className="text-muted-foreground text-xs">Belum ada penggunaan produk/mix</div>;
                        }
                        return lines.map((ln) => (
                          <div key={ln.key} className="grid grid-cols-12 items-start gap-2">
                            <div className="col-span-7">
                              {ln.name}
                              {Array.isArray(ln.components) && ln.components.length ? (
                                <div className="text-muted-foreground mt-1 grid gap-1 pl-4 text-xs">
                                  {ln.components.map((c, idx) => (
                                    <div key={idx}>
                                      • {c.name} ({c.qty})
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                            <div className="col-span-2 text-right">
                              Rp {Number(ln.unitPrice).toLocaleString("id-ID")}
                            </div>
                            <div className="col-span-1 text-right">{Number(ln.quantity)}</div>
                            <div className="col-span-2 text-right">
                              Rp {(Number(ln.unitPrice) * Number(ln.quantity)).toLocaleString("id-ID")}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>

                {/* Ringkasan angka (sinkron dengan estimate) */}
                <div className="grid grid-cols-2 gap-y-1 text-sm">
                  <div className="text-muted-foreground">Subtotal Jasa</div>
                  <div className="text-right">Rp {Number(estimate?.serviceSubtotal ?? 0).toLocaleString("id-ID")}</div>
                  <div className="text-muted-foreground">Subtotal Produk & Mix</div>
                  <div className="text-right">Rp {Number(estimate?.totalProducts ?? 0).toLocaleString("id-ID")}</div>
                  {/* Detail mix per komponen */}
                  {(() => {
                    const mixLines: { name: string; components: string }[] = [];
                    (Array.isArray(booking?.pets) ? booking.pets : []).forEach((bp: any) => {
                      const visitMix = (bp.visits ?? []).flatMap((v: any) => v.mixUsages ?? []);
                      const standaloneMix = bp.mixUsages ?? [];
                      const uniq = new Map<string | number, any>();
                      [...visitMix, ...standaloneMix].forEach((mu: any) => {
                        const key = mu?.id ?? `${mu?.mixProductId}|${mu?.visitId ?? ""}|${mu?.createdAt ?? ""}`;
                        if (!uniq.has(key)) uniq.set(key, mu);
                      });
                      Array.from(uniq.values()).forEach((mu: any) => {
                        const comps = (mu.mixProduct?.components ?? []).map(
                          (c: any) => `${c.product?.name ?? c.productId} (${Number(c.quantityBase)})`,
                        );
                        if (comps.length) {
                          mixLines.push({
                            name: mu.mixProduct?.name ?? `Mix#${mu.mixProductId}`,
                            components: comps.join(", "),
                          });
                        }
                      });
                    });
                    return mixLines.length ? (
                      <div className="text-muted-foreground col-span-2 text-xs">
                        {mixLines.map((m, i) => (
                          <div key={i}>
                            • {m.name}: {m.components}
                          </div>
                        ))}
                      </div>
                    ) : null;
                  })()}
                  <div className="text-muted-foreground">Daily Charges</div>
                  <div className="text-right">
                    Rp {Number(estimate?.totalDailyCharges ?? 0).toLocaleString("id-ID")}
                  </div>
                  <div className="text-muted-foreground">Total</div>
                  <div className="text-right font-medium">
                    Rp {Number(estimate?.total ?? 0).toLocaleString("id-ID")}
                  </div>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Addon (Service Tambahan)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <BookingItems bookingId={Number(id)} items={items} />
        </CardContent>
      </Card>
      {booking?.serviceType?.pricePerDay && booking?.proceedToAdmission ? (
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
      {Array.isArray(payments) && payments.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Pembayaran</CardTitle>
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
      {booking?.status !== "COMPLETED" && Number(estimate?.amountDue ?? 0) > 0 ? (
        <div className="flex justify-end">
          <CheckoutButton bookingId={Number(id)} label="Bayar" />
        </div>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pemeriksaan</CardTitle>
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
                    <div className="text-muted-foreground text-xs">Belum ada pemeriksaan</div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-muted-foreground text-sm">Tidak ada pet</div>
          )}
        </CardContent>
      </Card>
      {null}

      <Card>
        <CardHeader>
          <CardTitle>Pets</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {booking?.pets?.length ? (
            booking.pets.map((bp: { id: number; pet?: { name?: string } }) => (
              <div key={bp.id} className="rounded-md border p-2 text-sm">
                {bp.pet?.name}
              </div>
            ))
          ) : (
            <div className="text-muted-foreground text-sm">Tidak ada pet</div>
          )}
        </CardContent>
      </Card>
      {Array.isArray(booking?.pets) && booking.pets.length > 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Pisahkan Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <SplitBooking
              bookingId={Number(id)}
              pets={booking.pets.map((bp: any) => ({ id: bp.pet?.id, name: bp.pet?.name }))}
            />
          </CardContent>
        </Card>
      ) : null}
      {/* Tidak ada form pemeriksaan di halaman view */}
    </div>
  );
}
