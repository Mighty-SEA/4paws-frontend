"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

export function VisitHistory({ visits, items }: { visits: Visit[]; items?: AddonItem[] }) {
  const [openDate, setOpenDate] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [openDetail, setOpenDetail] = React.useState(false);
  const [selectedVisit, setSelectedVisit] = React.useState<Visit | null>(null);

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

  function openDateTimes(date: string) {
    setSelectedDate(date);
    setOpenDate(true);
  }

  function openVisitDetail(v: Visit) {
    setSelectedVisit(v);
    setOpenDate(false);
    setOpenDetail(true);
  }

  // Stable, locale-agnostic formatters to avoid hydration mismatch
  function formatDateYYYYMMDDtoDDMMYYYY(dateStr: string) {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }
  function formatTimeHHmm(isoLike: string | Date) {
    const s = new Date(isoLike).toISOString();
    return s.slice(11, 16); // HH:mm in UTC
  }
  function formatDateTime(isoLike: string | Date) {
    const s = new Date(isoLike).toISOString();
    return `${s.slice(0, 10)} ${s.slice(11, 16)}`; // YYYY-MM-DD HH:mm in UTC
  }

  return (
    <div className="grid gap-2">
      {groups.length === 0 ? (
        <div className="text-muted-foreground text-xs">Belum ada visit</div>
      ) : (
        groups.map((g) => (
          <div key={g.date} className="flex items-center justify-between rounded-md border p-2 text-xs">
            <div className="font-medium">{formatDateYYYYMMDDtoDDMMYYYY(g.date)}</div>
            <Button size="sm" variant="secondary" onClick={() => openDateTimes(g.date)}>
              Lihat Jam ({g.list.length})
            </Button>
          </div>
        ))
      )}

      <Dialog open={openDate} onOpenChange={setOpenDate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Visit pada {selectedDate ? formatDateYYYYMMDDtoDDMMYYYY(selectedDate) : "-"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            {(() => {
              const list = groups.find((x) => x.date === selectedDate)?.list ?? [];
              return list.length ? (
                list.map((v) => (
                  <Button key={v.id} variant="outline" onClick={() => openVisitDetail(v)}>
                    {formatTimeHHmm(v.visitDate)}
                  </Button>
                ))
              ) : (
                <div className="text-muted-foreground text-sm">Tidak ada visit</div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Detail Riwayat Visit</DialogTitle>
          </DialogHeader>
          {selectedVisit ? (
            <div className="grid gap-2 text-xs">
              <div className="font-medium">
                {formatDateTime(selectedVisit.visitDate)} • Dokter: {selectedVisit.doctor?.name ?? "-"} · Paravet:{" "}
                {selectedVisit.paravet?.name ?? "-"} · Admin: {selectedVisit.admin?.name ?? "-"} · Groomer:{" "}
                {selectedVisit.groomer?.name ?? "-"}
              </div>
              <div>
                W: {selectedVisit.weight ?? "-"} kg, T: {selectedVisit.temperature ?? "-"} °C
              </div>
              <div>
                Urine: {selectedVisit.urine ?? "-"} | Def: {selectedVisit.defecation ?? "-"} | App:{" "}
                {selectedVisit.appetite ?? "-"}
              </div>
              <div>Kondisi: {selectedVisit.condition ?? "-"}</div>
              <div>Gejala: {selectedVisit.symptoms ?? "-"}</div>
              <div>Catatan: {selectedVisit.notes ?? "-"}</div>
              {Array.isArray(selectedVisit.productUsages) && selectedVisit.productUsages.length > 0 ? (
                <div>
                  Produk:{" "}
                  {selectedVisit.productUsages
                    .map(
                      (pu: any) =>
                        `${pu.productName} (${pu.quantity}) @ Rp${Number(pu.unitPrice ?? 0).toLocaleString("id-ID")}`,
                    )
                    .join(", ")}
                </div>
              ) : null}
              {(() => {
                const dayKey = new Date(selectedVisit.visitDate).toISOString().slice(0, 10);
                const addons = (items ?? []).filter((it) => {
                  if (it?.role !== "ADDON") return false;
                  const sd = it?.startDate ? new Date(it.startDate) : null;
                  const key = sd ? sd.toISOString().slice(0, 10) : null;
                  return key === dayKey;
                });
                if (!addons.length) return null;
                return (
                  <div>
                    Addon:{" "}
                    {addons
                      .map((it) => {
                        const perDay = it?.serviceType?.pricePerDay != null;
                        const unit =
                          it?.unitPrice != null && it.unitPrice !== ""
                            ? Number(it.unitPrice)
                            : perDay
                              ? Number(it?.serviceType?.pricePerDay ?? 0)
                              : Number(it?.serviceType?.price ?? 0);
                        const qty = Number(it?.quantity ?? 1);
                        return `${it?.serviceType?.name ?? "-"} (${qty}) @ Rp${Number(unit).toLocaleString("id-ID")}`;
                      })
                      .join(", ")}
                  </div>
                );
              })()}
              {Array.isArray(selectedVisit.mixUsages) && selectedVisit.mixUsages.length > 0 ? (
                <div>
                  Mix:{" "}
                  {selectedVisit.mixUsages
                    .map(
                      (mu) =>
                        `${mu.mixProduct?.name ?? mu.mixProductId} (${Number(mu.quantity)}) @ Rp${Number(
                          mu.unitPrice ?? mu.mixProduct?.price ?? 0,
                        ).toLocaleString("id-ID")}`,
                    )
                    .join(", ")}
                </div>
              ) : null}
              {(() => {
                const prod = Array.isArray(selectedVisit.productUsages) ? selectedVisit.productUsages : [];
                const mix = Array.isArray(selectedVisit.mixUsages) ? selectedVisit.mixUsages : [];
                const addons: AddonItem[] = (() => {
                  const dayKey = new Date(selectedVisit.visitDate).toISOString().slice(0, 10);
                  return (items ?? []).filter((it) => {
                    if (it?.role !== "ADDON") return false;
                    const sd = it?.startDate ? new Date(it.startDate) : null;
                    const key = sd ? sd.toISOString().slice(0, 10) : null;
                    return key === dayKey;
                  });
                })();
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
                const total =
                  prod.reduce((s: number, pu: ProductUsage) => s + Number(pu.quantity) * Number(pu.unitPrice ?? 0), 0) +
                  mix.reduce(
                    (s: number, mu: MixUsage) =>
                      s + Number(mu.quantity) * Number(mu.unitPrice ?? mu.mixProduct?.price ?? 0),
                    0,
                  ) +
                  addonsCost;
                return (
                  <div className="text-right font-medium">
                    Total Pelayanan: Rp {Number(total).toLocaleString("id-ID")}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">Tidak ada data</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
