"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface ItemDiscount {
  itemType: "service" | "product" | "mix";
  itemId: number;
  itemName: string;
  originalPrice: number;
  quantity: number;
  currentDiscountPercent?: number;
  currentDiscountAmount?: number;
}

export function CheckoutButton({
  bookingId,
  label,
  items = [],
}: {
  bookingId: number;
  label?: string;
  items?: ItemDiscount[];
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [method, setMethod] = React.useState("Tunai");
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

  type Estimate = {
    serviceSubtotal?: number;
    totalProducts?: number;
    totalDailyCharges?: number;
    total?: number;
    depositSum?: number;
    amountDue?: number;
  };
  const [estimate, setEstimate] = React.useState<Estimate | null>(null);

  // Initialize item discounts from current values
  React.useEffect(() => {
    const initialDiscounts: Record<string, { discountPercent: number | ""; discountAmount: number | "" }> = {};
    items.forEach((item) => {
      const key = `${item.itemType}_${item.itemId}`;
      initialDiscounts[key] = {
        discountPercent: item.currentDiscountPercent ?? "",
        discountAmount: item.currentDiscountAmount ?? "",
      };
    });
    setItemDiscounts(initialDiscounts);
  }, [items]);

  React.useEffect(() => {
    let mounted = true;
    if (!open) return;
    (async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/billing/estimate`, { cache: "no-store" });
        const e = res.ok ? await res.json() : null;
        if (!mounted) return;
        setEstimate(e);
      } catch {
        if (!mounted) return;
        setEstimate(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open, bookingId]);

  const updateItemDiscount = (
    itemType: string,
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
        // Clear the other field when one is set
        ...(field === "discountPercent" && value !== "" ? { discountAmount: "" } : {}),
        ...(field === "discountAmount" && value !== "" ? { discountPercent: "" } : {}),
      },
    }));
  };

  const calculateItemDiscountedPrice = (item: ItemDiscount) => {
    const key = `${item.itemType}_${item.itemId}`;
    const discount = itemDiscounts[key];
    if (!discount) return item.originalPrice * item.quantity;

    const subtotal = item.originalPrice * item.quantity;
    const discountPercent = Number(discount.discountPercent ?? 0);
    const discountAmount = Number(discount.discountAmount ?? 0);

    const discountByPercent = discountPercent > 0 ? Math.round((subtotal * discountPercent) / 100) : 0;
    const effectiveDiscount = discountPercent > 0 ? discountByPercent : discountAmount;

    return Math.max(0, subtotal - effectiveDiscount);
  };

  const getTotalItemDiscount = () => {
    return items.reduce((total, item) => {
      const originalPrice = item.originalPrice * item.quantity;
      const discountedPrice = calculateItemDiscountedPrice(item);
      return total + (originalPrice - discountedPrice);
    }, 0);
  };

  async function doCheckout() {
    try {
      setLoading(true);

      // First, save item discounts
      const saveDiscountPromises = items.map(async (item) => {
        const key = `${item.itemType}_${item.itemId}`;
        const discount = itemDiscounts[key];

        if (!discount || (discount.discountPercent === "" && discount.discountAmount === "")) {
          return; // Skip items without discount
        }

        await fetch(`/api/bookings/${bookingId}/billing/item-discount`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemType: item.itemType,
            itemId: item.itemId,
            discountPercent: discount.discountPercent === "" ? undefined : Number(discount.discountPercent),
            discountAmount: discount.discountAmount === "" ? undefined : Number(discount.discountAmount),
          }),
        });
      });

      await Promise.all(saveDiscountPromises);

      // Then proceed with checkout
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
      router.refresh();
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }
  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={loading}>
        {loading ? "Memproses..." : (label ?? "Checkout")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pembayaran</DialogTitle>
            {(() => {
              const disc = Number(discountPercent ?? 0);
              const globalDiscount = (Number(estimate?.total ?? 0) * disc) / 100;
              const itemDiscount = getTotalItemDiscount();
              const discounted = Math.max(0, Number(estimate?.total ?? 0) - globalDiscount - itemDiscount);
              const due = Math.max(0, discounted - Number(estimate?.depositSum ?? 0));
              return (
                <div className="text-muted-foreground mt-1 flex items-center justify-between text-xs">
                  <span>Setelah diskon dan deposit</span>
                  <span className="text-foreground bg-muted rounded px-2 py-1 text-sm font-semibold">
                    Rp {due.toLocaleString("id-ID")}
                  </span>
                </div>
              );
            })()}
          </DialogHeader>

          <div className="space-y-4">
            {/* Item Details with Integrated Discounts */}
            {items.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Detail Item</h3>
                <div className="max-h-60 space-y-2 overflow-y-auto rounded border p-3">
                  {items.map((item) => {
                    const key = `${item.itemType}_${item.itemId}`;
                    const discount = itemDiscounts[key] ?? { discountPercent: "", discountAmount: "" };
                    const discountedPrice = calculateItemDiscountedPrice(item);
                    const originalPrice = item.originalPrice * item.quantity;
                    const discountAmount = originalPrice - discountedPrice;

                    return (
                      <div
                        key={key}
                        className="hover:bg-muted/40 border-border flex items-center justify-between rounded-md border p-2 text-sm transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{item.itemName}</div>
                          <div className="text-muted-foreground text-xs">
                            Qty: {item.quantity} × Rp {item.originalPrice.toLocaleString("id-ID")}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={discount.discountPercent}
                              onChange={(e) => {
                                const value =
                                  e.target.value === "" ? "" : Math.max(0, Math.min(100, Number(e.target.value)));
                                updateItemDiscount(item.itemType, item.itemId, "discountPercent", value);
                              }}
                              placeholder="Diskon"
                              className="h-7 w-24 pr-8 text-xs"
                            />
                            <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[11px]">
                              %
                            </span>
                          </div>
                          <span className="text-xs">atau</span>
                          <div className="relative">
                            <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-[11px]">
                              Rp
                            </span>
                            <Input
                              type="number"
                              min="0"
                              value={discount.discountAmount}
                              onChange={(e) => {
                                const value = e.target.value === "" ? "" : Math.max(0, Number(e.target.value));
                                updateItemDiscount(item.itemType, item.itemId, "discountAmount", value);
                              }}
                              placeholder="0"
                              className="h-7 w-28 pl-7 text-xs"
                            />
                          </div>
                          <div className="text-right">
                            {discountAmount > 0 && (
                              <div className="text-xs text-red-600">-Rp {discountAmount.toLocaleString("id-ID")}</div>
                            )}
                            <div className="text-sm font-semibold">Rp {discountedPrice.toLocaleString("id-ID")}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Separator />

            {/* Compact Summary */}
            <div className="rounded-md border p-3 text-sm">
              <div className="grid grid-cols-2 gap-y-1 md:grid-cols-4">
                <div className="text-muted-foreground">Total</div>
                <div className="md:col-span-3">Rp {Number(estimate?.total ?? 0).toLocaleString("id-ID")}</div>
                <div className="text-muted-foreground">Diskon Global</div>
                <div className="md:col-span-3">
                  {(() => {
                    const disc = Number(discountPercent ?? 0);
                    const amt = (Number(estimate?.total ?? 0) * disc) / 100;
                    return `${disc}% (Rp ${amt.toLocaleString("id-ID")})`;
                  })()}
                </div>
                <div className="text-muted-foreground">Diskon per Item</div>
                <div className="text-red-600 md:col-span-3">-Rp {getTotalItemDiscount().toLocaleString("id-ID")}</div>
                <div className="text-muted-foreground">Setelah Diskon</div>
                <div className="md:col-span-3">
                  {(() => {
                    const disc = Number(discountPercent ?? 0);
                    const globalDiscount = (Number(estimate?.total ?? 0) * disc) / 100;
                    const itemDiscount = getTotalItemDiscount();
                    const discounted = Math.max(0, Number(estimate?.total ?? 0) - globalDiscount - itemDiscount);
                    return `Rp ${discounted.toLocaleString("id-ID")}`;
                  })()}
                </div>
                <div className="text-muted-foreground">Deposit</div>
                <div className="md:col-span-3">Rp {Number(estimate?.depositSum ?? 0).toLocaleString("id-ID")}</div>
                <div className="text-muted-foreground">Sisa Tagihan</div>
                <div className="font-semibold md:col-span-3">
                  {(() => {
                    const disc = Number(discountPercent ?? 0);
                    const globalDiscount = (Number(estimate?.total ?? 0) * disc) / 100;
                    const itemDiscount = getTotalItemDiscount();
                    const discounted = Math.max(0, Number(estimate?.total ?? 0) - globalDiscount - itemDiscount);
                    const due = Math.max(0, discounted - Number(estimate?.depositSum ?? 0));
                    return `Rp ${due.toLocaleString("id-ID")}`;
                  })()}
                </div>
              </div>
            </div>

            <Separator />

            {/* Compact Payment Options */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <Label className="mb-1 block text-xs">Metode Pembayaran</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue placeholder="Pilih metode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tunai">Tunai</SelectItem>
                    <SelectItem value="QRIS">QRIS</SelectItem>
                    <SelectItem value="Transfer Bank">Transfer Bank</SelectItem>
                    <SelectItem value="Kartu Debit/Kredit">Kartu Debit/Kredit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Diskon Global (%)</Label>
                <div className="relative">
                  <Input
                    inputMode="numeric"
                    value={discountPercent}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "") return setDiscountPercent("");
                      const n = Math.max(0, Math.min(100, Number(v.replace(/[^0-9.]/g, ""))));
                      setDiscountPercent(Number.isFinite(n) ? n : "");
                    }}
                    placeholder="0"
                    className="h-8 pr-7"
                  />
                  <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[11px]">
                    %
                  </span>
                </div>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Catatan</Label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" className="h-8" />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={doCheckout} disabled={loading}>
              {(() => {
                if (loading) return "Memproses...";
                const disc = Number(discountPercent ?? 0);
                const globalDiscount = (Number(estimate?.total ?? 0) * disc) / 100;
                const itemDiscount = getTotalItemDiscount();
                const discounted = Math.max(0, Number(estimate?.total ?? 0) - globalDiscount - itemDiscount);
                const due = Math.max(0, discounted - Number(estimate?.depositSum ?? 0));
                const text = label ?? "Bayar";
                return due ? `${text} Rp ${due.toLocaleString("id-ID")}` : text;
              })()}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
