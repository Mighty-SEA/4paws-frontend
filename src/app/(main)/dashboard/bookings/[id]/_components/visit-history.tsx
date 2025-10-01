"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ProductUsage = { productName: string; quantity: string | number; unitPrice?: string | number };
type MixUsage = {
  mixProductId: number;
  mixProduct?: { name?: string; price?: string | number } | null;
  quantity: string | number;
  unitPrice?: string | number;
};
type AddonItem = {
  role?: string;
  startDate?: string;
  quantity?: string | number;
  unitPrice?: string | number;
  serviceType?: { name?: string; price?: string | number; pricePerDay?: string | number };
};
type Visit = {
  id: number;
  visitDate: string;
  doctor?: { name?: string } | null;
  paravet?: { name?: string } | null;
  admin?: { name?: string } | null;
  groomer?: { name?: string } | null;
  weight?: string | number | null;
  temperature?: string | number | null;
  urine?: string | null;
  defecation?: string | null;
  appetite?: string | null;
  condition?: string | null;
  symptoms?: string | null;
  notes?: string | null;
  productUsages?: ProductUsage[];
  mixUsages?: MixUsage[];
};

export function VisitHistory({
  bookingId,
  visits,
  items,
}: {
  bookingId: number;
  visits: Visit[];
  items?: AddonItem[];
}) {
  const [expandedDate, setExpandedDate] = React.useState<string | null>(null);

  const groups = React.useMemo(() => {
    const map = new Map<string, Visit[]>();
    (visits ?? []).forEach((v) => {
      const d = new Date(v.visitDate);
      const key = d.toISOString().slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(v);
      map.set(key, arr);
    });
    return Array.from(map.entries())
      .map(([date, list]) => ({
        date,
        list: list.sort((a, b) => +new Date(b.visitDate) - +new Date(a.visitDate)),
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [visits]);

  // Removed auto-expand logic to allow all visit history to be hidden

  // Stable, locale-agnostic formatters to avoid hydration mismatch
  function formatDateYYYYMMDDtoDDMMYYYY(dateStr: string) {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }

  function formatDateToIndonesian(dateStr: string) {
    const date = new Date(dateStr + "T00:00:00");
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    const dayName = days[date.getDay()];
    const day = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();

    return `${dayName}, ${day} ${monthName} ${year}`;
  }
  function formatTimeHHmm(isoLike: string | Date) {
    const s = new Date(isoLike).toISOString();
    return s.slice(11, 16); // HH:mm in UTC
  }

  function calcAddonsForDate(dateKey: string) {
    const addons = (items ?? []).filter((it) => {
      if (it?.role !== "ADDON") return false;
      const sd = it?.startDate ? new Date(it.startDate) : null;
      const key = sd ? sd.toISOString().slice(0, 10) : null;
      return key === dateKey;
    });
    const addonsCost = addons.reduce((s: number, it) => {
      const perDay = it?.serviceType?.pricePerDay != null;
      const unit =
        it?.unitPrice != null && it.unitPrice !== ""
          ? Number(it.unitPrice)
          : perDay
            ? Number(it?.serviceType?.pricePerDay ?? 0)
            : Number(it?.serviceType?.price ?? 0);
      const qty = Number(it?.quantity ?? 1);
      return s + unit * qty;
    }, 0);
    return { addons, addonsCost };
  }

  function calcVisitTotal(v: Visit) {
    const prod = Array.isArray(v.productUsages) ? v.productUsages : [];
    const mix = Array.isArray(v.mixUsages) ? v.mixUsages : [];
    const dayKey = new Date(v.visitDate).toISOString().slice(0, 10);
    const { addonsCost } = calcAddonsForDate(dayKey);
    const productsCost = prod.reduce(
      (s: number, pu: ProductUsage) => s + Number(pu.quantity) * Number(pu.unitPrice ?? 0),
      0,
    );
    const mixesCost = mix.reduce(
      (s: number, mu: MixUsage) => s + Number(mu.quantity) * Number(mu.unitPrice ?? (mu as any).mixProduct?.price ?? 0),
      0,
    );
    return productsCost + mixesCost + addonsCost;
  }

  return (
    <div className="grid gap-2">
      {groups.length === 0 ? (
        <div className="text-muted-foreground text-xs">Belum ada visit</div>
      ) : (
        groups.map((g) => {
          const dateSubtotal = g.list.reduce((s, v) => s + calcVisitTotal(v), 0);
          return (
            <div key={g.date} className="rounded-md border p-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold">{formatDateToIndonesian(g.date)}</div>
                  <div className="text-muted-foreground text-[11px]">{g.list.length} visit</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-[12px]">
                    <div className="text-muted-foreground leading-none">Subtotal</div>
                    <div className="font-medium">Rp {Number(dateSubtotal).toLocaleString("id-ID")}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setExpandedDate((d) => (d === g.date ? null : g.date))}
                  >
                    {expandedDate === g.date ? "Sembunyikan" : "Lihat Rincian"}
                  </Button>
                </div>
              </div>
              {expandedDate === g.date ? (
                <div className="mt-3 grid gap-2">
                  {g.list.map((v) => {
                    const prodCount = Array.isArray(v.productUsages) ? v.productUsages.length : 0;
                    const mixCount = Array.isArray(v.mixUsages) ? v.mixUsages.length : 0;
                    const dayKey = new Date(v.visitDate).toISOString().slice(0, 10);
                    const { addons } = calcAddonsForDate(dayKey);
                    const total = calcVisitTotal(v);
                    return (
                      <div key={v.id} className="rounded-md border p-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-muted rounded-full px-2 py-0.5 text-[11px] font-medium">
                              {formatTimeHHmm(v.visitDate)}
                            </span>
                            <span className="text-muted-foreground">
                              Dokter: {v.doctor?.name ?? "-"}
                              {v.paravet?.name ? ` · Paravet: ${v.paravet?.name}` : ""}
                              {v.groomer?.name ? ` · Groomer: ${v.groomer?.name}` : ""}
                            </span>
                          </div>
                          <div className="text-right font-medium">Rp {Number(total).toLocaleString("id-ID")}</div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border px-2 py-0.5 text-[11px]">W: {v.weight ?? "-"} kg</span>
                          <span className="rounded-full border px-2 py-0.5 text-[11px]">
                            T: {v.temperature ?? "-"} °C
                          </span>
                          <span className="rounded-full border px-2 py-0.5 text-[11px]">Produk: {prodCount}</span>
                          <span className="rounded-full border px-2 py-0.5 text-[11px]">Mix: {mixCount}</span>
                          <span className="rounded-full border px-2 py-0.5 text-[11px]">Addon: {addons.length}</span>
                        </div>
                        <div className="mt-2 grid gap-1 text-[11px]">
                          <div>
                            Urine: {v.urine ?? "-"} | Def: {v.defecation ?? "-"} | App: {v.appetite ?? "-"}
                          </div>
                          <div>Kondisi: {v.condition ?? "-"}</div>
                          <div>Gejala: {v.symptoms ?? "-"}</div>
                          <div>Catatan: {v.notes ?? "-"}</div>
                          <div className="mt-2">
                            <Table className="text-[11px]">
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Jenis</TableHead>
                                  <TableHead>Nama Item</TableHead>
                                  <TableHead className="text-right">Qty</TableHead>
                                  <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {Array.isArray(v.productUsages) &&
                                  v.productUsages.map((pu: any, idx: number) => {
                                    const qty = Number(pu.quantity ?? 0);
                                    const unit = Number(pu.unitPrice ?? 0);
                                    const sub = qty * unit;
                                    return (
                                      <TableRow key={`pu-${idx}`}>
                                        <TableCell>Produk</TableCell>
                                        <TableCell>{pu.productName}</TableCell>
                                        <TableCell className="text-right">{qty}</TableCell>
                                        <TableCell className="text-right">Rp {sub.toLocaleString("id-ID")}</TableCell>
                                      </TableRow>
                                    );
                                  })}
                                {addons.map((it, idx) => {
                                  const perDay = it?.serviceType?.pricePerDay != null;
                                  const unit =
                                    it?.unitPrice != null && it.unitPrice !== ""
                                      ? Number(it.unitPrice)
                                      : perDay
                                        ? Number(it?.serviceType?.pricePerDay ?? 0)
                                        : Number(it?.serviceType?.price ?? 0);
                                  const qty = Number(it?.quantity ?? 1);
                                  const sub = qty * unit;
                                  return (
                                    <TableRow key={`ad-${idx}`}>
                                      <TableCell>Addon</TableCell>
                                      <TableCell>{it?.serviceType?.name ?? "-"}</TableCell>
                                      <TableCell className="text-right">{qty}</TableCell>
                                      <TableCell className="text-right">Rp {sub.toLocaleString("id-ID")}</TableCell>
                                    </TableRow>
                                  );
                                })}
                                {Array.isArray(v.mixUsages) &&
                                  v.mixUsages.map((mu: any, idx: number) => {
                                    const qty = Number(mu.quantity ?? 0);
                                    const unit = Number(mu.unitPrice ?? mu.mixProduct?.price ?? 0);
                                    const sub = qty * unit;
                                    return (
                                      <React.Fragment key={`mx-${idx}`}>
                                        <TableRow>
                                          <TableCell>Mix</TableCell>
                                          <TableCell>{mu.mixProduct?.name ?? mu.mixProductId}</TableCell>
                                          <TableCell className="text-right">{qty}</TableCell>
                                          <TableCell className="text-right">Rp {sub.toLocaleString("id-ID")}</TableCell>
                                        </TableRow>
                                        {(() => {
                                          // Check for components in mu.components or mu.mixProduct?.components
                                          const components = Array.isArray(mu.components)
                                            ? mu.components
                                            : Array.isArray(mu.mixProduct?.components)
                                              ? mu.mixProduct.components
                                              : [];

                                          if (components.length > 0) {
                                            return components.map((comp: any, compIdx: number) => {
                                              const compQty = Number(comp.quantity ?? comp.quantityBase ?? 0);
                                              return (
                                                <TableRow key={`mx-${idx}-comp-${compIdx}`} className="bg-muted/30">
                                                  <TableCell className="pl-6 text-xs">- Sub item</TableCell>
                                                  <TableCell className="text-xs">
                                                    {comp.productName ?? comp.product?.name ?? comp.productId}
                                                  </TableCell>
                                                  <TableCell className="text-right text-xs">{compQty}</TableCell>
                                                  <TableCell className="text-right text-xs">-</TableCell>
                                                </TableRow>
                                              );
                                            });
                                          } else {
                                            return (
                                              <TableRow className="bg-muted/30">
                                                <TableCell className="pl-6 text-xs">- Detail sub item</TableCell>
                                                <TableCell className="text-muted-foreground text-xs">
                                                  Tidak tersedia
                                                </TableCell>
                                                <TableCell className="text-right text-xs">-</TableCell>
                                                <TableCell className="text-right text-xs">-</TableCell>
                                              </TableRow>
                                            );
                                          }
                                        })()}
                                      </React.Fragment>
                                    );
                                  })}
                              </TableBody>
                            </Table>
                          </div>
                          <div className="mt-2 flex justify-end">
                            <a
                              className="text-xs underline"
                              href={`/dashboard/bookings/${bookingId}/visit/${v.id}/edit`}
                            >
                              Edit visit
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}
