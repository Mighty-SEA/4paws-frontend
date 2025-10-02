/* eslint-disable import/order */
import { headers } from "next/headers";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VisitHistory } from "../../bookings/[id]/_components/visit-history";
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
  }> = [];
  for (const rec of records) {
    const serviceName = rec?.booking?.serviceType?.name;
    const baseServiceName = rec?.booking?.serviceType?.service?.name as string | undefined;
    const isPerDay = /rawat inap|pet hotel/i.test(String(baseServiceName ?? ""));
    const bookingId = rec?.bookingId ?? rec?.booking?.id;
    const exams = Array.isArray(rec?.examinations) ? rec.examinations : [];
    const visits = Array.isArray(rec?.visits) ? rec.visits : [];
    for (const ex of exams) {
      const dateStr = (ex.createdAt ?? ex.updatedAt ?? ex.examDate) as string | undefined;
      timeline.push({ id: `EX-${ex.id}`, date: dateStr, serviceName, isPerDay, exam: ex, visits, bookingId });
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
              const productTotal = products.reduce(
                (s: number, pu: { quantity?: number | string; unitPrice?: number | string }) =>
                  s + Number(pu.quantity ?? 0) * Number(pu.unitPrice ?? 0),
                0,
              );
              const visits = Array.isArray(en.visits) ? en.visits : [];
              const visitProductsTotal = visits.reduce((sum: number, v) => {
                const vp = Array.isArray(v.productUsages) ? v.productUsages : [];
                return (
                  sum +
                  vp.reduce(
                    (s: number, pu: { quantity?: number | string; unitPrice?: number | string }) =>
                      s + Number(pu.quantity ?? 0) * Number(pu.unitPrice ?? 0),
                    0,
                  )
                );
              }, 0);
              const visitMixTotal = visits.reduce((sum: number, v) => {
                const vm = Array.isArray(v.mixUsages) ? v.mixUsages : [];
                return (
                  sum +
                  vm.reduce(
                    (
                      s: number,
                      mu: {
                        quantity?: number | string;
                        unitPrice?: number | string;
                        mixProduct?: { price?: number | string } | null;
                      },
                    ) => s + Number(mu.quantity ?? 0) * Number(mu.unitPrice ?? mu.mixProduct?.price ?? 0),
                    0,
                  )
                );
              }, 0);
              const grandTotal = productTotal + visitProductsTotal + visitMixTotal;
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

                  <div className="grid gap-1">
                    <div className="text-muted-foreground">Staf</div>
                    <div>
                      Dokter: {ex?.doctor?.name ?? "-"} · Paravet: {ex?.paravet?.name ?? "-"} · Admin:{" "}
                      {ex?.admin?.name ?? "-"} · Groomer: {ex?.groomer?.name ?? "-"}
                    </div>
                  </div>
                  <div>
                    Berat: {ex?.weight ?? "-"} kg, Suhu: {ex?.temperature ?? "-"} °C
                  </div>
                  <div>
                    Urine: {ex?.urine ?? "-"} · Def: {ex?.defecation ?? "-"} · App: {ex?.appetite ?? "-"} · Kondisi:{" "}
                    {ex?.condition ?? "-"}
                  </div>
                  {ex?.chiefComplaint ? (
                    <div>
                      <span className="text-muted-foreground">Keluhan: </span>
                      {ex.chiefComplaint}
                    </div>
                  ) : null}
                  {ex?.additionalNotes ? (
                    <div>
                      <span className="text-muted-foreground">Catatan Tambahan: </span>
                      {ex.additionalNotes}
                    </div>
                  ) : null}
                  <div>Catatan: {ex?.notes ?? "-"}</div>
                  {ex?.diagnosis ? (
                    <div>
                      <span className="text-muted-foreground">Diagnosis: </span>
                      {ex.diagnosis}
                    </div>
                  ) : null}
                  {ex?.prognosis ? (
                    <div>
                      <span className="text-muted-foreground">Prognosis: </span>
                      {ex.prognosis}
                    </div>
                  ) : null}

                  {products.length ? (
                    <div className="grid gap-1">
                      <div className="text-sm font-medium">Item yang dipakai</div>
                      {products.map((pu, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div>
                            {pu.productName} <span className="text-muted-foreground">({pu.quantity})</span>
                          </div>
                          <div>Rp {Number(pu.unitPrice ?? 0).toLocaleString("id-ID")}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}

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
                              <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map((it: any, idx: number) => {
                              const role = String(it?.role ?? "");
                              const perDay = it?.serviceType?.pricePerDay != null;
                              const unit =
                                it?.unitPrice != null && it.unitPrice !== ""
                                  ? Number(it.unitPrice)
                                  : perDay
                                    ? Number(it?.serviceType?.pricePerDay ?? 0)
                                    : Number(it?.serviceType?.price ?? 0);
                              const qty = Number(it?.quantity ?? 1);
                              const sub = qty * unit;
                              const kind = role === "ADDON" ? "Addon" : "Layanan";
                              const name = it?.serviceType?.name ?? it?.serviceType?.service?.name ?? "-";
                              return (
                                <TableRow key={`it-${idx}`}>
                                  <TableCell>{kind}</TableCell>
                                  <TableCell>{name}</TableCell>
                                  <TableCell className="text-right">{qty}</TableCell>
                                  <TableCell className="text-right">Rp {sub.toLocaleString("id-ID")}</TableCell>
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
                      <div className="text-sm font-medium">Riwayat Visit</div>
                      <VisitHistory
                        bookingId={Number(en.bookingId ?? ex?.booking?.id ?? 0)}
                        visits={Array.isArray(en.visits) ? en.visits : []}
                        items={Array.isArray(ex?.booking?.items) ? ex.booking.items : []}
                      />
                    </div>
                  ) : null}

                  <div className="mt-1 text-right text-sm font-semibold">
                    Total Perawatan: Rp {grandTotal.toLocaleString("id-ID")}
                  </div>
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
