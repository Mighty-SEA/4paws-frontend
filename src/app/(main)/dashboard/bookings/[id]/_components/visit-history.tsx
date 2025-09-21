"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Visit = any;

export function VisitHistory({ visits }: { visits: Visit[] }) {
  const [openDate, setOpenDate] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [openDetail, setOpenDetail] = React.useState(false);
  const [selectedVisit, setSelectedVisit] = React.useState<Visit | null>(null);

  const groups = React.useMemo(() => {
    const map = new Map<string, Visit[]>();
    (visits ?? []).forEach((v: any) => {
      const d = new Date(v.visitDate);
      const key = d.toISOString().slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(v);
      map.set(key, arr);
    });
    return Array.from(map.entries())
      .map(([date, list]) => ({
        date,
        list: list.sort((a: any, b: any) => +new Date(b.visitDate) - +new Date(a.visitDate)),
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
              {Array.isArray(selectedVisit.mixUsages) && selectedVisit.mixUsages.length > 0 ? (
                <div>
                  Mix:{" "}
                  {selectedVisit.mixUsages
                    .map(
                      (mu: any) =>
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
                const total =
                  prod.reduce((s: number, pu: any) => s + Number(pu.quantity) * Number(pu.unitPrice ?? 0), 0) +
                  mix.reduce(
                    (s: number, mu: any) => s + Number(mu.quantity) * Number(mu.unitPrice ?? mu.mixProduct?.price ?? 0),
                    0,
                  );
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
