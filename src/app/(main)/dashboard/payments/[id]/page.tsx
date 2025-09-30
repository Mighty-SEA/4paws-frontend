"use client";

import * as React from "react";

import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Estimate = {
  serviceSubtotal?: number;
  totalProducts?: number;
  total?: number;
  depositSum?: number;
  amountDue?: number;
};

export default function PaymentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const bookingId = Number(params?.id);

  const [loading, setLoading] = React.useState(false);
  const [method, setMethod] = React.useState("");
  const [note, setNote] = React.useState("");
  const [discountPercent, setDiscountPercent] = React.useState<number | "">("");
  const [itemDiscounts, setItemDiscounts] = React.useState<
    Record<
      string,
      {
        discountPercent: number | "";
        discountAmount: number | "";
      }
    >
  >({});

  const [booking, setBooking] = React.useState<any>(null);
  const [estimate, setEstimate] = React.useState<Estimate | null>(null);
  const [deposits, setDeposits] = React.useState<any[]>([]);
  const [payments, setPayments] = React.useState<any[]>([]);

  const discountItems = React.useMemo(() => {
    const items: Array<{
      itemType: "service" | "product" | "mix";
      itemId: number;
      itemName: string;
      unitPrice: number;
      quantity: number;
      typeLabel: string;
    }> = [];
    const svc = booking?.serviceType;
    const petsArr = Array.isArray(booking?.pets) ? booking.pets : [];
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
    if (svc) {
      const start = normalizeDay(booking?.startDate);
      const end = normalizeDay(booking?.endDate);
      const perDay = svc?.pricePerDay ? Number(svc.pricePerDay) : 0;
      const flat = svc?.price ? Number(svc.price) : 0;
      const unit = perDay ? perDay : flat;
      const days = perDay ? calcDays(start, end) : 0;
      const qty = perDay ? Math.max(petsArr.length, 1) * days : 1;
      items.push({
        itemType: "service",
        itemId: 0,
        itemName: `${svc?.service?.name ?? "Service"} - ${svc?.name ?? "Primary"}`,
        unitPrice: unit,
        quantity: qty,
        typeLabel: "Layanan (Primary)",
      });
    }
    const addonItems = Array.isArray(booking?.items) ? booking.items : [];
    addonItems.forEach((it: any) => {
      const st = it?.serviceType ?? {};
      const perDay = st?.pricePerDay ? Number(st.pricePerDay) : 0;
      const flat = st?.price ? Number(st.price) : 0;
      const hasCustomUnit = it?.unitPrice !== undefined && it.unitPrice !== null && String(it.unitPrice) !== "";
      const unit = hasCustomUnit ? Number(it.unitPrice) : perDay ? perDay : flat;
      const qty = Number(it?.quantity ?? 1) || 1;
      items.push({
        itemType: "service",
        itemId: it.id,
        itemName: `${st?.service?.name ?? "Service"} - ${st?.name ?? "Addon"}`,
        unitPrice: unit,
        quantity: qty,
        typeLabel: "Layanan (Addon)",
      });
    });
    petsArr.forEach((bp: any) => {
      const examUsages = (bp.examinations ?? []).flatMap((ex: any) => ex.productUsages ?? []);
      const visitProductUsages = (bp.visits ?? []).flatMap((v: any) => v.productUsages ?? []);
      const visitMix = (bp.visits ?? []).flatMap((v: any) => v.mixUsages ?? []);
      const standaloneMix = bp.mixUsages ?? [];
      [...examUsages, ...visitProductUsages].forEach((pu: any) => {
        items.push({
          itemType: "product",
          itemId: pu.id,
          itemName: String(pu.productName ?? "Produk"),
          unitPrice: Number(pu.unitPrice ?? 0),
          quantity: Number(pu.quantity ?? 0),
          typeLabel: "Produk",
        });
      });
      [...visitMix, ...standaloneMix].forEach((mu: any) => {
        items.push({
          itemType: "mix",
          itemId: mu.id,
          itemName: (() => {
            const raw = String(mu.mixProduct?.name ?? "Mix");
            return raw.split("#")[0].trim();
          })(),
          unitPrice: Number(mu.unitPrice ?? mu.mixProduct?.price ?? 0),
          quantity: Number(mu.quantity ?? 0),
          typeLabel: "Mix",
        });
      });
    });
    return items;
  }, [booking]);

  async function saveItemDiscounts() {
    const savePromises: Promise<any>[] = [];
    discountItems.forEach((item) => {
      const key = `${item.itemType}_${item.itemId}`;
      const d = itemDiscounts[key];
      if (!d || (d.discountPercent === "" && d.discountAmount === "")) return;
      savePromises.push(
        fetch(`/api/bookings/${bookingId}/billing/item-discount`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemType: item.itemType,
            itemId: item.itemId,
            discountPercent: d.discountPercent === "" ? undefined : Number(d.discountPercent),
            discountAmount: d.discountAmount === "" ? undefined : Number(d.discountAmount),
          }),
        }),
      );
    });
    await Promise.all(savePromises);
  }

  // Initialize per-item discounts from current values
  React.useEffect(() => {
    const items = Array.isArray(booking?.items) ? booking.items : [];
    const svc = booking?.serviceType;
    const init: Record<string, { discountPercent: number | ""; discountAmount: number | "" }> = {};
    if (svc) {
      init[`service_0`] = {
        discountPercent: Number(booking?.primaryDiscountPercent ?? 0) || "",
        discountAmount: Number(booking?.primaryDiscountAmount ?? 0) || "",
      };
    }
    items.forEach((it: any) => {
      init[`service_${it.id}`] = {
        discountPercent: Number(it.discountPercent ?? 0) || "",
        discountAmount: Number(it.discountAmount ?? 0) || "",
      };
    });
    const pets = Array.isArray(booking?.pets) ? booking.pets : [];
    pets.forEach((bp: any) => {
      const examUsages = (bp.examinations ?? []).flatMap((ex: any) => ex.productUsages ?? []);
      const visitProductUsages = (bp.visits ?? []).flatMap((v: any) => v.productUsages ?? []);
      const visitMix = (bp.visits ?? []).flatMap((v: any) => v.mixUsages ?? []);
      const standaloneMix = bp.mixUsages ?? [];
      [...examUsages, ...visitProductUsages].forEach((pu: any) => {
        init[`product_${pu.id}`] = {
          discountPercent: Number(pu.discountPercent ?? 0) || "",
          discountAmount: Number(pu.discountAmount ?? 0) || "",
        };
      });
      [...visitMix, ...standaloneMix].forEach((mu: any) => {
        init[`mix_${mu.id}`] = {
          discountPercent: Number(mu.discountPercent ?? 0) || "",
          discountAmount: Number(mu.discountAmount ?? 0) || "",
        };
      });
    });
    setItemDiscounts(init);
  }, [booking]);

  const updateItemDiscount = (
    itemType: "service" | "product" | "mix",
    itemId: number,
    field: "discountPercent" | "discountAmount",
    value: number | "",
  ) => {
    const key = `${itemType}_${itemId}`;
    setItemDiscounts((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
        ...(field === "discountPercent" && value !== "" ? { discountAmount: "" } : {}),
        ...(field === "discountAmount" && value !== "" ? { discountPercent: "" } : {}),
      },
    }));
  };

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [bRes, eRes, dRes, pRes] = await Promise.all([
          fetch(`/api/bookings/${bookingId}`, { cache: "no-store" }),
          fetch(`/api/bookings/${bookingId}/billing/estimate`, { cache: "no-store" }),
          fetch(`/api/bookings/${bookingId}/deposits`, { cache: "no-store" }),
          fetch(`/api/bookings/${bookingId}/payments`, { cache: "no-store" }),
        ]);
        const [b, e, d, p] = await Promise.all([
          bRes.ok ? bRes.json() : null,
          eRes.ok ? eRes.json() : null,
          dRes.ok ? dRes.json() : [],
          pRes.ok ? pRes.json() : [],
        ]);
        if (!mounted) return;
        setBooking(b);
        setEstimate(e);
        setDeposits(Array.isArray(d) ? d : []);
        setPayments(Array.isArray(p) ? p : []);
      } catch {
        if (!mounted) return;
        setBooking(null);
        setEstimate(null);
        setDeposits([]);
        setPayments([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [bookingId]);

  async function handlePay() {
    try {
      setLoading(true);
      // Persist per-item discounts first
      const savePromises: Promise<any>[] = [];
      // Primary service as service_0
      if (booking?.serviceType) {
        const d = itemDiscounts[`service_0`];
        if (d && (d.discountPercent !== "" || d.discountAmount !== "")) {
          savePromises.push(
            fetch(`/api/bookings/${bookingId}/billing/item-discount`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                itemType: "service",
                itemId: 0,
                discountPercent: d.discountPercent === "" ? undefined : Number(d.discountPercent),
                discountAmount: d.discountAmount === "" ? undefined : Number(d.discountAmount),
              }),
            }),
          );
        }
      }
      // Addon services and product/mix
      const items = Array.isArray(booking?.items) ? booking.items : [];
      items.forEach((it: any) => {
        const d = itemDiscounts[`service_${it.id}`];
        if (d && (d.discountPercent !== "" || d.discountAmount !== "")) {
          savePromises.push(
            fetch(`/api/bookings/${bookingId}/billing/item-discount`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                itemType: "service",
                itemId: it.id,
                discountPercent: d.discountPercent === "" ? undefined : Number(d.discountPercent),
                discountAmount: d.discountAmount === "" ? undefined : Number(d.discountAmount),
              }),
            }),
          );
        }
      });
      const pets = Array.isArray(booking?.pets) ? booking.pets : [];
      pets.forEach((bp: any) => {
        const examUsages = (bp.examinations ?? []).flatMap((ex: any) => ex.productUsages ?? []);
        const visitProductUsages = (bp.visits ?? []).flatMap((v: any) => v.productUsages ?? []);
        const visitMix = (bp.visits ?? []).flatMap((v: any) => v.mixUsages ?? []);
        const standaloneMix = bp.mixUsages ?? [];
        [...examUsages, ...visitProductUsages].forEach((pu: any) => {
          const d = itemDiscounts[`product_${pu.id}`];
          if (d && (d.discountPercent !== "" || d.discountAmount !== "")) {
            savePromises.push(
              fetch(`/api/bookings/${bookingId}/billing/item-discount`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  itemType: "product",
                  itemId: pu.id,
                  discountPercent: d.discountPercent === "" ? undefined : Number(d.discountPercent),
                  discountAmount: d.discountAmount === "" ? undefined : Number(d.discountAmount),
                }),
              }),
            );
          }
        });
        [...visitMix, ...standaloneMix].forEach((mu: any) => {
          const d = itemDiscounts[`mix_${mu.id}`];
          if (d && (d.discountPercent !== "" || d.discountAmount !== "")) {
            savePromises.push(
              fetch(`/api/bookings/${bookingId}/billing/item-discount`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  itemType: "mix",
                  itemId: mu.id,
                  discountPercent: d.discountPercent === "" ? undefined : Number(d.discountPercent),
                  discountAmount: d.discountAmount === "" ? undefined : Number(d.discountAmount),
                }),
              }),
            );
          }
        });
      });
      await Promise.all(savePromises);

      const res = await fetch(`/api/bookings/${bookingId}/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          note,
          discountPercent: discountPercent === "" ? undefined : Number(discountPercent),
        }),
      });
      if (!res.ok) return;
      router.push(`/dashboard/bookings/${bookingId}/invoice`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pembayaran Booking #{bookingId}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Ringkasan Booking</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="grid grid-cols-2 gap-y-1 md:grid-cols-4">
              <div className="text-muted-foreground">Owner</div>
              <div className="md:col-span-3">{booking?.owner?.name ?? "-"}</div>
              <div className="text-muted-foreground">Layanan</div>
              <div className="md:col-span-3">{booking?.serviceType?.service?.name ?? "-"}</div>
              <div className="text-muted-foreground">Tipe</div>
              <div className="md:col-span-3">{booking?.serviceType?.name ?? "-"}</div>
              <div className="text-muted-foreground">Status</div>
              <div className="md:col-span-3">{booking?.status ?? "-"}</div>
            </div>
            {Array.isArray(booking?.items) && booking.items.filter((it: any) => it.role === "ADDON").length > 0 ? (
              <div className="rounded-md border p-3">
                <div className="mb-2 text-sm font-medium">Addon</div>
                <div className="grid gap-1 text-sm">
                  {booking.items
                    .filter((it: any) => it.role === "ADDON")
                    .map((it: any) => (
                      <div key={it.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{it.serviceType?.name ?? "-"}</div>
                          <div className="text-muted-foreground text-xs">{it.serviceType?.service?.name ?? "-"}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : null}
            {null}

            {/* Diskon per Item - table merged inside Ringkasan */}
            <div className="rounded-md border">
              <div className="p-3 text-sm font-medium">Diskon per Item</div>
              <div className="overflow-x-auto p-2">
                {discountItems.length ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30">
                        <th className="px-2 py-2 text-left">Item</th>
                        <th className="px-2 py-2 text-left">Tipe</th>
                        <th className="px-2 py-2 text-right">Harga</th>
                        <th className="px-2 py-2 text-right">Qty</th>
                        <th className="px-2 py-2 text-right">Diskon (%)</th>
                        <th className="px-2 py-2 text-right">Diskon (Rp)</th>
                        <th className="px-2 py-2 text-right">Harga setelah Diskon</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discountItems.map((it) => {
                        const key = `${it.itemType}_${it.itemId}`;
                        const d = itemDiscounts[key] ?? { discountPercent: "", discountAmount: "" };
                        const original = Number(it.unitPrice) * Number(it.quantity);
                        const discPercent = Number(d.discountPercent || 0);
                        const discAmount = Number(d.discountAmount || 0);
                        const discByPercent = discPercent > 0 ? Math.round((original * discPercent) / 100) : 0;
                        const effective = discPercent > 0 ? discByPercent : discAmount;
                        const discounted = Math.max(0, original - effective);
                        return (
                          <tr key={key} className="border-b">
                            <td className="px-2 py-2">{it.itemName}</td>
                            <td className="px-2 py-2">{it.typeLabel}</td>
                            <td className="px-2 py-2 text-right">{Number(it.unitPrice).toLocaleString("id-ID")}</td>
                            <td className="px-2 py-2 text-right">{Number(it.quantity)}</td>
                            <td className="px-2 py-2 text-right">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={d.discountPercent}
                                onChange={(e) => {
                                  const v =
                                    e.target.value === "" ? "" : Math.max(0, Math.min(100, Number(e.target.value)));
                                  updateItemDiscount(it.itemType, it.itemId, "discountPercent", v as any);
                                }}
                                className="h-8 w-24 text-right"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-2 py-2 text-right">
                              <Input
                                type="number"
                                min="0"
                                value={d.discountAmount}
                                onChange={(e) => {
                                  const v = e.target.value === "" ? "" : Math.max(0, Number(e.target.value));
                                  updateItemDiscount(it.itemType, it.itemId, "discountAmount", v as any);
                                }}
                                className="h-8 w-32 text-right"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-2 py-2 text-right">{discounted.toLocaleString("id-ID")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-muted-foreground p-3 text-sm">Tidak ada item</div>
                )}
              </div>
              <div className="flex justify-end p-3">
                <Button
                  variant="secondary"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await saveItemDiscounts();
                      router.refresh();
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? "Menyimpan..." : "Simpan Diskon"}
                </Button>
              </div>
            </div>

            {Array.isArray(deposits) && deposits.length ? (
              <div>
                <div className="mb-2 text-sm font-medium">Riwayat Deposit</div>
                <div className="grid gap-2">
                  {deposits.map((d) => (
                    <div key={d.id} className="rounded-md border p-2 text-xs">
                      <div>{new Date(d.depositDate).toLocaleString()}</div>
                      <div>Jumlah: Rp {Number(d.amount ?? 0).toLocaleString("id-ID")}</div>
                      <div>Metode: {d.method ?? "-"}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {Array.isArray(payments) && payments.length ? (
              <div>
                <div className="mb-2 text-sm font-medium">Pembayaran Sebelumnya</div>
                <div className="grid gap-2">
                  {payments.map((p) => (
                    <div key={p.id} className="rounded-md border p-2 text-xs">
                      <div>{new Date(p.createdAt).toLocaleString()}</div>
                      <div>Amount: Rp {Number(p.amount ?? 0).toLocaleString("id-ID")}</div>
                      <div>Metode: {p.method ?? "-"}</div>
                      <div>Invoice: {p.invoiceNo ?? "-"}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Merged into Ringkasan Booking: remove separate discount card */}
        {null}
        <Card className="hidden md:col-span-2">
          <CardHeader>
            <CardTitle>Diskon per Item</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {discountItems.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="px-2 py-2 text-left">Item</th>
                      <th className="px-2 py-2 text-left">Tipe</th>
                      <th className="px-2 py-2 text-right">Harga</th>
                      <th className="px-2 py-2 text-right">Qty</th>
                      <th className="px-2 py-2 text-right">Diskon (%)</th>
                      <th className="px-2 py-2 text-right">Diskon (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discountItems.map((it) => {
                      const key = `${it.itemType}_${it.itemId}`;
                      const d = itemDiscounts[key] ?? { discountPercent: "", discountAmount: "" };
                      return (
                        <tr key={key} className="border-b">
                          <td className="px-2 py-2">{it.itemName}</td>
                          <td className="px-2 py-2">{it.typeLabel}</td>
                          <td className="px-2 py-2 text-right">{Number(it.unitPrice).toLocaleString("id-ID")}</td>
                          <td className="px-2 py-2 text-right">{Number(it.quantity)}</td>
                          <td className="px-2 py-2 text-right">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={d.discountPercent}
                              onChange={(e) => {
                                const v =
                                  e.target.value === "" ? "" : Math.max(0, Math.min(100, Number(e.target.value)));
                                updateItemDiscount(it.itemType, it.itemId, "discountPercent", v as any);
                              }}
                              className="h-8 w-24 text-right"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-2 py-2 text-right">
                            <Input
                              type="number"
                              min="0"
                              value={d.discountAmount}
                              onChange={(e) => {
                                const v = e.target.value === "" ? "" : Math.max(0, Number(e.target.value));
                                updateItemDiscount(it.itemType, it.itemId, "discountAmount", v as any);
                              }}
                              className="h-8 w-32 text-right"
                              placeholder="0"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">Tidak ada item</div>
            )}
            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={async () => {
                  setLoading(true);
                  try {
                    await saveItemDiscounts();
                    router.refresh();
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                {loading ? "Menyimpan..." : "Simpan Diskon"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Form Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-md border">
              <div className="grid grid-cols-2 gap-y-1 p-3 text-sm md:grid-cols-4">
                <div className="text-muted-foreground">Subtotal Layanan</div>
                <div className="md:col-span-3">Rp {(estimate?.serviceSubtotal ?? 0).toLocaleString("id-ID")}</div>
                <div className="text-muted-foreground">Products</div>
                <div className="md:col-span-3">Rp {(estimate?.totalProducts ?? 0).toLocaleString("id-ID")}</div>
                <div className="text-muted-foreground">Deposit</div>
                <div className="md:col-span-3">Rp {(estimate?.depositSum ?? 0).toLocaleString("id-ID")}</div>
                <div className="text-muted-foreground">Total</div>
                <div className="md:col-span-3">Rp {(estimate?.total ?? 0).toLocaleString("id-ID")}</div>
                <div className="text-muted-foreground">Setelah Diskon</div>
                <div className="md:col-span-3">
                  {(() => {
                    const disc = Number(discountPercent || 0);
                    const discountAmount = ((estimate?.total ?? 0) * disc) / 100;
                    const discountedTotal = Math.max(0, (estimate?.total ?? 0) - discountAmount);
                    return `Rp ${discountedTotal.toLocaleString("id-ID")}`;
                  })()}
                </div>
                <div className="text-muted-foreground">Sisa Tagihan</div>
                <div className="font-semibold md:col-span-3">
                  {(() => {
                    const disc = Number(discountPercent || 0);
                    const discountAmount = ((estimate?.total ?? 0) * disc) / 100;
                    const discountedTotal = Math.max(0, (estimate?.total ?? 0) - discountAmount);
                    const due = Math.max(0, discountedTotal - (estimate?.depositSum ?? 0));
                    return `Rp ${due.toLocaleString("id-ID")}`;
                  })()}
                </div>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Metode Pembayaran</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih metode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                  <SelectItem value="QRIS">QRIS</SelectItem>
                  <SelectItem value="DEBIT">Debit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Catatan</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" />
            </div>
            <div className="flex justify-end">
              <Button onClick={handlePay} disabled={loading}>
                {loading ? "Memproses..." : "Bayar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
