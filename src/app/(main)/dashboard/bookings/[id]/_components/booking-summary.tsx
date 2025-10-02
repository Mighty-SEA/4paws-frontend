"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BookingSummaryProps = {
  booking: any;
  estimate: any;
  invoice: any;
};

export function BookingSummary({ booking, estimate, invoice }: BookingSummaryProps) {
  const discountPercent = Number(invoice?.discountPercent ?? 0);
  const discountAmount = Number(invoice?.discountAmount ?? 0);

  // Calculate item-level discount total
  const itemLevelDiscountTotal = React.useMemo(() => {
    try {
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

      let serviceDiscount = 0;
      if (svc) {
        const start = normalizeDay(booking?.startDate);
        const end = normalizeDay(booking?.endDate);
        const perDay = svc?.pricePerDay ? Number(svc.pricePerDay) : 0;
        const flat = svc?.price ? Number(svc.price) : 0;
        const unit = perDay ? perDay : flat;
        const primaryDays = perDay ? calcDays(start, end) : 0;
        const primaryPetFactor = perDay ? (Array.isArray(pets) ? pets.length : 0) : 0;
        const primaryQty = perDay ? Math.max(primaryPetFactor, 1) * primaryDays : 1;
        const primarySubtotal = unit * primaryQty;
        const pdp = Number(booking?.primaryDiscountPercent ?? 0);
        const pda = Number(booking?.primaryDiscountAmount ?? 0);
        const pdByPercent = pdp > 0 ? Math.round((primarySubtotal * pdp) / 100) : 0;
        const primaryDiscount = pdp > 0 ? pdByPercent : pda;
        serviceDiscount += Math.max(0, primaryDiscount);
      }

      for (const it of items) {
        const st = it?.serviceType ?? {};
        const perDay = st?.pricePerDay ? Number(st.pricePerDay) : 0;
        const flat = st?.price ? Number(st.price) : 0;
        const hasCustomUnit = it?.unitPrice !== undefined && it.unitPrice !== null && String(it.unitPrice) !== "";
        const unit = hasCustomUnit ? Number(it.unitPrice) : perDay ? perDay : flat;
        const s = normalizeDay(it?.startDate ?? booking?.startDate);
        const e = normalizeDay(it?.endDate ?? booking?.endDate);
        const qty = Number(it?.quantity ?? 1) || 1;
        const subtotal = perDay ? unit * calcDays(s, e) * qty : unit * qty;
        const dp = Number(it?.discountPercent ?? 0);
        const da = Number(it?.discountAmount ?? 0);
        const byPct = dp > 0 ? Math.round((subtotal * dp) / 100) : 0;
        serviceDiscount += Math.max(0, dp > 0 ? byPct : da);
      }

      return Math.max(0, serviceDiscount);
    } catch {
      return 0;
    }
  }, [booking]);

  const svcName = String(booking?.serviceType?.service?.name ?? "");
  const typeName = String(booking?.serviceType?.name ?? "");
  const isPetshop = /petshop/i.test(svcName) || /petshop/i.test(typeName);

  return (
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
            {!isPetshop ? (
              <>
                <div className="text-muted-foreground">Jasa Layanan</div>
                <div className="text-right">
                  Rp {Number(estimate?.serviceSubtotal ?? estimate?.baseService ?? 0).toLocaleString("id-ID")}
                </div>
              </>
            ) : null}
            <div className="text-muted-foreground">Total Products</div>
            <div className="text-right">Rp {Number(estimate?.totalProducts ?? 0).toLocaleString("id-ID")}</div>
            <div className="text-muted-foreground">Diskon</div>
            <div className="text-right">
              {(() => {
                const globalDiscAmt = Number(discountAmount ?? 0);
                const itemDiscAmt = Number(itemLevelDiscountTotal ?? 0);
                const hasGlobal = Number(discountPercent ?? 0) > 0;
                const totalDisc = globalDiscAmt + itemDiscAmt;
                if (!totalDisc) return "-";
                return hasGlobal
                  ? `${Number(discountPercent)}% + Rp ${itemDiscAmt.toLocaleString("id-ID")} (Rp ${totalDisc.toLocaleString("id-ID")})`
                  : `Rp ${totalDisc.toLocaleString("id-ID")}`;
              })()}
            </div>
            <div className="text-muted-foreground">Total</div>
            <div className="text-right font-medium">
              {(() => {
                const total = Number(estimate?.total ?? 0);
                const globalDiscAmt = Number(discountAmount ?? 0);
                const itemDiscAmt = Number(itemLevelDiscountTotal ?? 0);
                const discounted = Math.max(0, total - globalDiscAmt - itemDiscAmt);
                return `Rp ${discounted.toLocaleString("id-ID")}`;
              })()}
            </div>
            <div className="text-muted-foreground">Deposit</div>
            <div className="text-right">Rp {Number(estimate?.depositSum ?? 0).toLocaleString("id-ID")}</div>
            <div className="text-muted-foreground">Sisa Tagihan</div>
            <div className="text-right font-semibold">
              {(() => {
                const total = Number(estimate?.total ?? 0);
                const globalDiscAmt = Number(discountAmount ?? 0);
                const itemDiscAmt = Number(itemLevelDiscountTotal ?? 0);
                const discounted = Math.max(0, total - globalDiscAmt - itemDiscAmt);
                const due = Math.max(0, discounted - Number(estimate?.depositSum ?? 0));
                return `Rp ${due.toLocaleString("id-ID")}`;
              })()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
