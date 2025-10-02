/* eslint-disable import/order */
import * as React from "react";
import { headers } from "next/headers";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

export default async function MedicalRecordDetailPage({ params }: { params: Promise<{ petId: string }> }) {
  const { petId } = await params;
  const data = await fetchJSON(`/api/owners/pets/${petId}/medical-records`);
  const pet = data?.pet ?? null;
  const records = Array.isArray(data?.records) ? data.records : [];

  const timeline: Array<{
    id: string;
    date?: string;
    serviceName?: string;
    isPerDay?: boolean;
    exam?: any;
    visits?: any[];
    bookingId?: number;
    bookingItems?: any[];
    standaloneSingles?: any[];
    standaloneMix?: any[];
  }> = [];
  for (const rec of records) {
    const serviceName = rec?.booking?.serviceType?.name;
    const baseServiceName = rec?.booking?.serviceType?.service?.name as string | undefined;
    const isPerDay = /rawat inap|pet hotel/i.test(String(baseServiceName ?? ""));
    const bookingId = rec?.bookingId ?? rec?.booking?.id;
    const exams = Array.isArray(rec?.examinations) ? rec.examinations : [];
    const visits = Array.isArray(rec?.visits) ? rec.visits : [];
    const bookingItems = Array.isArray(rec?.booking?.items) ? rec.booking.items : [];
    const standaloneSingles = Array.isArray(rec?.productUsages)
      ? rec.productUsages.filter((pu: any) => !pu?.visitId && !pu?.examinationId)
      : [];
    const standaloneMix = Array.isArray(rec?.mixUsages) ? rec.mixUsages.filter((mu: any) => !mu?.visitId) : [];
    for (const ex of exams) {
      const dateStr = (ex.createdAt ?? ex.updatedAt ?? ex.examDate) as string | undefined;
      timeline.push({
        id: `EX-${ex.id}`,
        date: dateStr,
        serviceName,
        isPerDay,
        exam: ex,
        visits,
        bookingId,
        bookingItems,
        standaloneSingles,
        standaloneMix,
      });
    }
  }
  timeline.sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Medical Record · Pet #{petId}</h1>
        <div className="flex gap-2">
          <Link
            href="/dashboard/medical-records"
            className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-8 items-center justify-center rounded-md border px-3 text-sm font-medium whitespace-nowrap shadow-sm transition-colors"
          >
            Kembali
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Biodata Hewan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-muted-foreground">Nama</div>
            <div className="col-span-2 font-medium">{pet?.name ?? "-"}</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-muted-foreground">Pemilik</div>
            <div className="col-span-2">{pet?.owner?.name ?? "-"}</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-muted-foreground">Jenis</div>
            <div className="col-span-2">{pet?.species ?? "-"}</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-muted-foreground">Ras</div>
            <div className="col-span-2">{pet?.breed ?? "-"}</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-muted-foreground">Lahir</div>
            <div className="col-span-2">{pet?.birthdate ? new Date(pet.birthdate).toLocaleDateString() : "-"}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pemeriksaan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {timeline.length ? (
            timeline.map((en) => {
              const ex = en.exam ?? {};
              const products: Array<{ productName: string; quantity: number | string; unitPrice?: number | string }> =
                Array.isArray(ex.productUsages) ? ex.productUsages : [];
              const visits = Array.isArray(en.visits) ? en.visits : [];
              return (
                <div key={en.id} className="grid gap-2 rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Pemeriksaan</Badge>
                      <div className="text-muted-foreground">{en.serviceName ?? "Layanan"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {en.bookingId ? (
                        <a
                          className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-8 items-center justify-center rounded-md border px-3 text-sm font-medium whitespace-nowrap shadow-sm transition-colors"
                          href={`/dashboard/bookings/${en.bookingId}`}
                        >
                          Booking
                        </a>
                      ) : null}
                      <div>{en.date ? new Date(en.date).toLocaleString() : "-"}</div>
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm">
                    <div className="grid grid-cols-12 gap-2">
                      <div className="text-muted-foreground col-span-3">Staf</div>
                      <div className="col-span-9">
                        Dokter: {ex?.doctor?.name ?? "-"} · Paravet: {ex?.paravet?.name ?? "-"} · Admin:{" "}
                        {ex?.admin?.name ?? "-"} · Groomer: {ex?.groomer?.name ?? "-"}
                      </div>
                    </div>
                    <div className="grid grid-cols-12 gap-2">
                      <div className="text-muted-foreground col-span-3">Vitals</div>
                      <div className="col-span-9">
                        Berat: {ex?.weight ?? "-"} kg · Suhu: {ex?.temperature ?? "-"} °C
                      </div>
                    </div>
                    <div className="grid grid-cols-12 gap-2">
                      <div className="text-muted-foreground col-span-3">Kondisi</div>
                      <div className="col-span-9">
                        Urine: {ex?.urine ?? "-"} · Def: {ex?.defecation ?? "-"} · App: {ex?.appetite ?? "-"} · Kondisi:{" "}
                        {ex?.condition ?? "-"}
                      </div>
                    </div>
                    {ex?.chiefComplaint ? (
                      <div className="grid grid-cols-12 gap-2">
                        <div className="text-muted-foreground col-span-3">Keluhan</div>
                        <div className="col-span-9 line-clamp-2 whitespace-pre-line">{ex.chiefComplaint}</div>
                      </div>
                    ) : null}
                    {ex?.additionalNotes ? (
                      <div className="grid grid-cols-12 gap-2">
                        <div className="text-muted-foreground col-span-3">Catatan Tambahan</div>
                        <div className="col-span-9 line-clamp-2 whitespace-pre-line">{ex.additionalNotes}</div>
                      </div>
                    ) : null}
                    <div className="grid grid-cols-12 gap-2">
                      <div className="text-muted-foreground col-span-3">Catatan</div>
                      <div className="col-span-9 line-clamp-2 whitespace-pre-line">{ex?.notes ?? "-"}</div>
                    </div>
                    {ex?.diagnosis ? (
                      <div className="grid grid-cols-12 gap-2">
                        <div className="text-muted-foreground col-span-3">Diagnosis</div>
                        <div className="col-span-9 line-clamp-2 whitespace-pre-line">{ex.diagnosis}</div>
                      </div>
                    ) : null}
                    {ex?.prognosis ? (
                      <div className="grid grid-cols-12 gap-2">
                        <div className="text-muted-foreground col-span-3">Prognosis</div>
                        <div className="col-span-9 line-clamp-2 whitespace-pre-line">{ex.prognosis}</div>
                      </div>
                    ) : null}
                  </div>

                  {(() => {
                    const dayKey = en.date ? new Date(en.date).toISOString().slice(0, 10) : null;
                    const visitsList = Array.isArray(en.visits) ? en.visits : [];
                    const matchedVisits = dayKey
                      ? visitsList.filter((v: any) => new Date(v.visitDate).toISOString().slice(0, 10) === dayKey)
                      : [];
                    const bookingItems = Array.isArray(en?.bookingItems)
                      ? en.bookingItems
                      : Array.isArray(ex?.booking?.items)
                        ? ex.booking.items
                        : [];
                    const addons = bookingItems.filter((it: any) => {
                      if (String(it?.role ?? "") !== "ADDON") return false;
                      if (!dayKey) return false;
                      const sd = it?.startDate ? new Date(it.startDate) : null;
                      const key = sd ? sd.toISOString().slice(0, 10) : null;
                      return key === dayKey;
                    });
                    // Merge visit-based and standalone (booking-pet level) usages on the same day
                    const visitMix = matchedVisits.flatMap((v: any) => (Array.isArray(v.mixUsages) ? v.mixUsages : []));
                    const standaloneMix = Array.isArray(en?.standaloneMix) ? en.standaloneMix : [];
                    const mixUsages = [...visitMix, ...standaloneMix];
                    const standaloneSingles = Array.isArray(en?.standaloneSingles) ? en.standaloneSingles : [];
                    const hasAny =
                      (products?.length ?? 0) > 0 ||
                      addons.length > 0 ||
                      mixUsages.length > 0 ||
                      standaloneSingles.length > 0;
                    if (!hasAny) return null;
                    return (
                      <div className="grid gap-1">
                        <div className="text-sm font-medium">Item yang dipakai</div>
                        <Table className="text-[12px]">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Jenis</TableHead>
                              <TableHead>Rincian</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Array.isArray(products) &&
                              products.map((pu: any, idx: number) => (
                                <TableRow key={`ex-pu-${idx}`}>
                                  <TableCell>
                                    <Badge variant="secondary">Produk</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="truncate" title={`${pu.productName} (${Number(pu.quantity ?? 0)})`}>
                                      {pu.productName} ({Number(pu.quantity ?? 0)})
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            {standaloneSingles.map((pu: any, idx: number) => (
                              <TableRow key={`ex-ss-${idx}`}>
                                <TableCell>
                                  <Badge variant="secondary">Produk</Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="truncate" title={`${pu.productName} (${Number(pu.quantity ?? 0)})`}>
                                    {pu.productName} ({Number(pu.quantity ?? 0)})
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                            {addons.map((it: any, idx: number) => (
                              <TableRow key={`ex-ad-${idx}`}>
                                <TableCell>
                                  <Badge variant="secondary">Addon</Badge>
                                </TableCell>
                                <TableCell>
                                  <div
                                    className="truncate"
                                    title={`${it?.serviceType?.name ?? "-"} (${Number(it?.quantity ?? 1)})`}
                                  >
                                    {it?.serviceType?.name ?? "-"} ({Number(it?.quantity ?? 1)})
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                            {mixUsages.map((mu: any, idx: number) => {
                              const components = Array.isArray(mu?.components)
                                ? mu.components
                                : Array.isArray(mu?.mixProduct?.components)
                                  ? mu.mixProduct.components
                                  : [];
                              const mixName = mu?.mixProduct?.name ?? mu?.mixProductId;
                              const mixQty = Number(mu.quantity ?? 0);
                              return (
                                <TableRow key={`ex-mx-${mu?.id ?? idx}`}>
                                  <TableCell>
                                    <Badge variant="secondary">Mix</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="truncate" title={`${mixName} (${mixQty})`}>
                                      {mixName} ({mixQty})
                                    </div>
                                    {components.length ? (
                                      <div className="text-muted-foreground mt-1 grid gap-1 pl-4">
                                        {components.map((comp: any, compIdx: number) => {
                                          const compQty = Number(comp?.quantity ?? comp?.quantityBase ?? 0);
                                          const compName = comp?.productName ?? comp?.product?.name ?? comp?.productId;
                                          return (
                                            <div
                                              key={`ex-mx-${mu?.id ?? idx}-comp-${compIdx}`}
                                              className="truncate text-xs"
                                              title={`${compName} (${compQty})`}
                                            >
                                              • {compName} ({compQty})
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : null}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  })()}

                  {(() => {
                    const items = Array.isArray(ex?.booking?.items) ? ex.booking.items : [];
                    if (!items.length) return null;
                    return (
                      <div className="grid gap-1">
                        <div className="text-sm font-medium">Item Booking</div>
                        <Table className="text-[12px]">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Jenis</TableHead>
                              <TableHead>Nama Item</TableHead>
                              <TableHead className="text-right">Qty</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map((it: any, idx: number) => {
                              const role = String(it?.role ?? "");
                              const perDay = it?.serviceType?.pricePerDay != null;
                              const qty = Number(it?.quantity ?? 1);
                              const kind = role === "ADDON" ? "Addon" : "Layanan";
                              const name = it?.serviceType?.name ?? it?.serviceType?.service?.name ?? "-";
                              return (
                                <TableRow key={`it-${idx}`}>
                                  <TableCell>{kind}</TableCell>
                                  <TableCell>{name}</TableCell>
                                  <TableCell className="text-right">{qty}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  })()}

                  {en.isPerDay ? (
                    <div className="grid gap-2">
                      <div className="text-sm font-medium">Visit Terakhir</div>
                      {(() => {
                        const list = Array.isArray(en.visits) ? en.visits : [];
                        if (!list.length) {
                          return <div className="text-muted-foreground text-xs">Belum ada visit</div>;
                        }
                        const last = [...list].sort(
                          (a: any, b: any) => +new Date(b.visitDate) - +new Date(a.visitDate),
                        )[0];
                        const prodCount = Array.isArray(last.productUsages) ? last.productUsages.length : 0;
                        const mixCount = Array.isArray(last.mixUsages) ? last.mixUsages.length : 0;
                        return (
                          <div className="rounded-md border p-2 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="font-medium">{new Date(last.visitDate).toLocaleString()}</div>
                            </div>
                            <div className="text-muted-foreground mt-1">
                              Dokter: {last?.doctor?.name ?? "-"}
                              {last?.paravet?.name ? ` · Paravet: ${last.paravet.name}` : ""}
                              {last?.groomer?.name ? ` · Groomer: ${last.groomer.name}` : ""}
                            </div>
                            <div className="mt-1">
                              W: {last?.weight ?? "-"} kg · T: {last?.temperature ?? "-"} °C
                            </div>
                            <div className="mt-1 text-[11px]">
                              Produk: {prodCount} · Mix: {mixCount}
                            </div>
                            {prodCount || mixCount ? (
                              <div className="mt-2">
                                <Table className="text-[11px]">
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Jenis</TableHead>
                                      <TableHead>Rincian</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {Array.isArray(last.productUsages) &&
                                      last.productUsages.map((pu: any, idx: number) => (
                                        <TableRow key={`pu-${idx}`}>
                                          <TableCell>
                                            <Badge variant="secondary">Produk</Badge>
                                          </TableCell>
                                          <TableCell>
                                            <div
                                              className="truncate"
                                              title={`${pu.productName} (${Number(pu.quantity ?? 0)})`}
                                            >
                                              {pu.productName} ({Number(pu.quantity ?? 0)})
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    {(() => {
                                      // Tambahkan ADDON untuk hari yang sama (referensi VisitHistory)
                                      const dayKey = new Date(last.visitDate).toISOString().slice(0, 10);
                                      const items = Array.isArray(ex?.booking?.items) ? ex.booking.items : [];
                                      const addons = items.filter((it: any) => {
                                        if (String(it?.role ?? "") !== "ADDON") return false;
                                        const sd = it?.startDate ? new Date(it.startDate) : null;
                                        const key = sd ? sd.toISOString().slice(0, 10) : null;
                                        return key === dayKey;
                                      });
                                      return addons.map((it: any, idx: number) => (
                                        <TableRow key={`ad-${idx}`}>
                                          <TableCell>
                                            <Badge variant="secondary">Addon</Badge>
                                          </TableCell>
                                          <TableCell>
                                            <div
                                              className="truncate"
                                              title={`${it?.serviceType?.name ?? "-"} (${Number(it?.quantity ?? 1)})`}
                                            >
                                              {it?.serviceType?.name ?? "-"} ({Number(it?.quantity ?? 1)})
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      ));
                                    })()}
                                    {Array.isArray(last.mixUsages) &&
                                      last.mixUsages.map((mu: any, idx: number) => {
                                        const components = Array.isArray(mu?.components)
                                          ? mu.components
                                          : Array.isArray(mu?.mixProduct?.components)
                                            ? mu.mixProduct.components
                                            : [];
                                        const mixName = mu?.mixProduct?.name ?? mu?.mixProductId;
                                        const mixQty = Number(mu.quantity ?? 0);
                                        return (
                                          <TableRow key={`mx-${mu?.id ?? idx}`}>
                                            <TableCell>
                                              <Badge variant="secondary">Mix</Badge>
                                            </TableCell>
                                            <TableCell>
                                              <div className="truncate" title={`${mixName} (${mixQty})`}>
                                                {mixName} ({mixQty})
                                              </div>
                                              {components.length ? (
                                                <div className="text-muted-foreground mt-1 grid gap-1 pl-4">
                                                  {components.map((comp: any, compIdx: number) => {
                                                    const compQty = Number(comp?.quantity ?? comp?.quantityBase ?? 0);
                                                    const compName =
                                                      comp?.productName ?? comp?.product?.name ?? comp?.productId;
                                                    return (
                                                      <div
                                                        key={`mx-${mu?.id ?? idx}-comp-${compIdx}`}
                                                        className="truncate text-xs"
                                                        title={`${compName} (${compQty})`}
                                                      >
                                                        • {compName} ({compQty})
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              ) : null}
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                  </TableBody>
                                </Table>
                              </div>
                            ) : null}
                          </div>
                        );
                      })()}
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="text-muted-foreground text-sm">Belum ada rekam medis</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
