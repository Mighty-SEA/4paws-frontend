"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { revalidateBookingDetail } from "../actions";

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
      await revalidateBookingDetail();
      router.refresh();
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }
  // Redirect always to payments page for any booking id
  return (
    <Button asChild disabled={loading}>
      <a href={`/dashboard/payments/${bookingId}`}>{label ?? "Bayar"}</a>
    </Button>
  );
}
