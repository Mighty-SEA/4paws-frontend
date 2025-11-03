"use client";
/* eslint-disable import/order */
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getMixPriceSuggestion, loadMixPriceDefaults, rememberMixPrice } from "@/lib/mix-price-defaults";
import { ChevronsUpDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export function VisitForm({
  bookingId,
  bookingPetId,
  ownerName,
  petName,
  minDate,
  maxDate,
  booking,
  initial,
  editVisitId,
  existingMixUsageIds,
}: {
  bookingId: number;
  bookingPetId: number;
  ownerName?: string;
  petName?: string;
  minDate?: string;
  maxDate?: string;
  booking?: any;
  initial?: {
    visitDate?: string;
    weight?: string | number;
    temperature?: string | number;
    notes?: string;
    urine?: string;
    defecation?: string;
    appetite?: string;
    condition?: string;
    symptoms?: string;
    doctorId?: number | string;
    paravetId?: number | string;
    adminId?: number | string;
    groomerId?: number | string;
    products?: Array<{ productName: string; quantity: string | number }>;
    mixes?: Array<{
      name?: string;
      price?: string | number;
      quantity?: string | number;
      components: Array<{ productId: number | string; quantityBase?: string | number; quantity?: string | number }>;
    }>;
  };
  editVisitId?: number;
  existingMixUsageIds?: number[];
}) {
  const router = useRouter();
  const editing = editVisitId != null;
  const [visitDate, setVisitDate] = React.useState("");
  const [weight, setWeight] = React.useState("");
  const [temperature, setTemperature] = React.useState("");
  const [notes, setNotes] = React.useState("");
  // Satwagia-like extras
  const [doctorId, setDoctorId] = React.useState("");
  const [doctors, setDoctors] = React.useState<Array<{ id: number; name: string }>>([]);
  const [paravetId, setParavetId] = React.useState("");
  const [adminId, setAdminId] = React.useState("");
  const [groomerId, setGroomerId] = React.useState("");
  const [paravets, setParavets] = React.useState<Array<{ id: number; name: string }>>([]);
  const [admins, setAdmins] = React.useState<Array<{ id: number; name: string }>>([]);
  const [groomers, setGroomers] = React.useState<Array<{ id: number; name: string }>>([]);
  const [isGrooming, setIsGrooming] = React.useState(false);
  const [urine, setUrine] = React.useState("");
  const [defecation, setDefecation] = React.useState("");
  const [appetite, setAppetite] = React.useState("");
  const [condition, setCondition] = React.useState("");
  const [symptoms, setSymptoms] = React.useState("");
  const [productsList, setProductsList] = React.useState<
    Array<{ id: number; name: string; unit?: string; unitContentAmount?: number; unitContentName?: string }>
  >([]);
  // Addon selector for visit
  const [serviceTypes, setServiceTypes] = React.useState<Array<{ id: number; name: string }>>([]);
  const [addonServiceTypeId, setAddonServiceTypeId] = React.useState("");
  // qty not needed; default to 1 on submit
  // Mix template removed for Visit; use only Quick Mix
  type ItemComponent = { id: string; productId: string; quantity: string };
  type ItemGroup = { id: string; label?: string; price?: string; components: ItemComponent[]; autoLabel?: boolean };
  const [items, setItems] = React.useState<ItemGroup[]>([
    {
      id: Math.random().toString(36).slice(2),
      label: "",
      price: "",
      components: [{ id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
      autoLabel: true,
    },
  ]);
  // Initialize from initial prop (prefill last visit data)
  const initializedFromInitial = React.useRef(false);
  const isDirtyRef = React.useRef(false);
  React.useEffect(() => {
    void loadMixPriceDefaults();
  }, []);
  const VISIT_STAFF_DEFAULTS_STORAGE_KEY = "visit-staff-defaults.v1";
  const appliedVisitStaffDefaultsRef = React.useRef(false);
  const FALLBACK_MIX_PRICE = "55000";
  const parsePriceValue = React.useCallback((value: string | undefined): number | null => {
    const digits = String(value ?? "").replace(/[^0-9]/g, "");
    if (!digits) return null;
    const numeric = Number(digits);
    return Number.isFinite(numeric) ? numeric : null;
  }, []);
  const hasPriceValue = React.useCallback((value: string | undefined) => {
    return value != null && String(value).trim().length > 0;
  }, []);

  React.useEffect(() => {
    if (editing || appliedVisitStaffDefaultsRef.current) return;
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(VISIT_STAFF_DEFAULTS_STORAGE_KEY);
      if (!raw) {
        appliedVisitStaffDefaultsRef.current = true;
        return;
      }
      const data = JSON.parse(raw) as {
        doctorId?: string | number | null;
        paravetId?: string | number | null;
        adminId?: string | number | null;
        groomerId?: string | number | null;
      };
      if (!doctorId && data.doctorId != null) setDoctorId(String(data.doctorId));
      if (!paravetId && data.paravetId != null) setParavetId(String(data.paravetId));
      if (!adminId && data.adminId != null) setAdminId(String(data.adminId));
      if (!groomerId && data.groomerId != null) setGroomerId(String(data.groomerId));
    } catch (error) {
      console.warn("visit-form: gagal memuat staff defaults", error);
    }
    appliedVisitStaffDefaultsRef.current = true;
  }, [editing, doctorId, paravetId, adminId, groomerId]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = {
      doctorId: doctorId || null,
      paravetId: paravetId || null,
      adminId: adminId || null,
      groomerId: groomerId || null,
    };
    try {
      window.localStorage.setItem(VISIT_STAFF_DEFAULTS_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn("visit-form: gagal menyimpan staff defaults", error);
    }
  }, [doctorId, paravetId, adminId, groomerId]);
  React.useEffect(() => {
    if (!initial || initializedFromInitial.current || isDirtyRef.current) return;
    const needProductsLookup = Array.isArray(initial.products) && initial.products.length > 0;
    if (needProductsLookup && productsList.length === 0) return; // wait until products loaded
    if (initial.visitDate) setVisitDate(initial.visitDate);
    if (initial.weight !== undefined) setWeight(String(initial.weight ?? ""));
    if (initial.temperature !== undefined) setTemperature(String(initial.temperature ?? ""));
    if (initial.notes !== undefined) setNotes(initial.notes ?? "");
    if (initial.urine !== undefined) setUrine(initial.urine ?? "");
    if (initial.defecation !== undefined) setDefecation(initial.defecation ?? "");
    if (initial.appetite !== undefined) setAppetite(initial.appetite ?? "");
    if (initial.condition !== undefined) setCondition(initial.condition ?? "");
    if (initial.symptoms !== undefined) setSymptoms(initial.symptoms ?? "");
    if (initial.doctorId !== undefined) setDoctorId(String(initial.doctorId ?? ""));
    if (initial.paravetId !== undefined) setParavetId(String(initial.paravetId ?? ""));
    if (initial.adminId !== undefined) setAdminId(String(initial.adminId ?? ""));
    if (initial.groomerId !== undefined) setGroomerId(String(initial.groomerId ?? ""));

    const nextItems: ItemGroup[] = [];
    const mixComponentProductIds = new Set<string>();
    // Map mixes first (become Item + multiple sub-items)
    if (Array.isArray(initial.mixes)) {
      for (const mix of initial.mixes) {
        const qty = Number(mix.quantity ?? 1) || 1;
        const components = Array.isArray(mix.components)
          ? mix.components.map((c) => {
              const base = Number((c as any).quantityBase ?? 0) || 0;
              const directQty = (c as any).quantity;
              const finalQty = directQty != null && String(directQty) !== "" ? String(directQty) : String(base * qty);
              const pid = String(c.productId);
              mixComponentProductIds.add(pid);
              return {
                id: Math.random().toString(36).slice(2),
                productId: pid,
                quantity: finalQty,
              };
            })
          : [];
        if (components.length) {
          let resolvedLabel = mix.name ? String(mix.name) : "";
          const priceStr = (() => {
            if (mix.price != null && String(mix.price).trim() !== "") {
              return String(mix.price);
            }
            const suggestion = getMixPriceSuggestion(resolvedLabel);
            return suggestion != null ? String(suggestion) : "";
          })();
          if (!resolvedLabel && components[0]?.productId) {
            const firstName = productsList.find((x) => String(x.id) === String(components[0]?.productId))?.name ?? "";
            resolvedLabel = firstName;
          }
          nextItems.push({
            id: Math.random().toString(36).slice(2),
            label: resolvedLabel,
            price: priceStr,
            components,
            autoLabel: true,
          });
          if (resolvedLabel && priceStr) {
            rememberMixPrice(resolvedLabel, priceStr);
          }
        }
      }
    }
    // Map single product usages as standalone items
    if (Array.isArray(initial.products)) {
      for (const p of initial.products) {
        const prodId = String(productsList.find((x) => x.name === String(p.productName ?? ""))?.id ?? "");
        if (mixComponentProductIds.has(prodId)) continue; // avoid duplicate single if already part of a mix
        nextItems.push({
          id: Math.random().toString(36).slice(2),
          label: "",
          price: "",
          components: [
            {
              id: Math.random().toString(36).slice(2),
              productId: prodId,
              quantity: String(p.quantity ?? ""),
            },
          ],
          autoLabel: true,
        });
      }
    }
    if (nextItems.length) setItems(nextItems);
    initializedFromInitial.current = true;
  }, [initial, productsList]);
  // mixItems removed
  const [quickMix, setQuickMix] = React.useState<{
    name: string;
    price: string;
    components: Array<{ id: string; productId: string; quantity: string }>;
  }>({
    name: "",
    price: "",
    components: [{ id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
  });

  React.useEffect(() => {
    (async () => {
      const resProd = await fetch("/api/products", { cache: "no-store" });
      if (resProd.ok) {
        const data = await resProd.json();
        setProductsList(
          Array.isArray(data)
            ? data.map((p: any) => ({
                id: p.id,
                name: p.name,
                unit: p.unit,
                unitContentAmount: p.unitContentAmount,
                unitContentName: p.unitContentName,
              }))
            : [],
        );
      }
      const resTypes = await fetch("/api/service-types", { cache: "no-store" });
      if (resTypes.ok) {
        const data = await resTypes.json();
        setServiceTypes(Array.isArray(data) ? data.map((t: any) => ({ id: t.id, name: t.name })) : []);
      }
      // no mix-products needed for Visit anymore
      const resStaff = await fetch("/api/staff", { cache: "no-store" });
      if (resStaff.ok) {
        const data = await resStaff.json();
        setDoctors(
          Array.isArray(data)
            ? data.filter((s: any) => s.jobRole === "DOCTOR").map((s: any) => ({ id: s.id, name: s.name }))
            : [],
        );
        setParavets(
          Array.isArray(data)
            ? data.filter((s: any) => s.jobRole === "PARAVET").map((s: any) => ({ id: s.id, name: s.name }))
            : [],
        );
        setAdmins(
          Array.isArray(data)
            ? data.filter((s: any) => s.jobRole === "ADMIN").map((s: any) => ({ id: s.id, name: s.name }))
            : [],
        );
        setGroomers(
          Array.isArray(data)
            ? data.filter((s: any) => s.jobRole === "GROOMER").map((s: any) => ({ id: s.id, name: s.name }))
            : [],
        );
      }
    })();
  }, []);

  // Detect grooming service
  React.useEffect(() => {
    if (!booking) return;

    try {
      // Check main service
      const svcName = String(booking?.serviceType?.service?.name ?? "").toLowerCase();
      const typeName = String(booking?.serviceType?.name ?? "").toLowerCase();
      const isMainGrooming = svcName.includes("groom") || typeName.includes("groom");

      // Check booking items for grooming addon
      const hasGroomingAddon =
        Array.isArray(booking?.items) &&
        booking.items.some((item: any) => {
          const itemSvcName = String(item?.serviceType?.service?.name ?? "").toLowerCase();
          const itemTypeName = String(item?.serviceType?.name ?? "").toLowerCase();
          return itemSvcName.includes("groom") || itemTypeName.includes("groom");
        });

      setIsGrooming(isMainGrooming || hasGroomingAddon);
    } catch {
      setIsGrooming(false);
    }
  }, [booking]);

  // Detect grooming addon selection
  React.useEffect(() => {
    if (!addonServiceTypeId) return;

    const selectedService = serviceTypes.find((st) => st.id === Number(addonServiceTypeId));
    if (selectedService) {
      const serviceName = selectedService.name.toLowerCase();
      if (serviceName.includes("groom")) {
        setIsGrooming(true);
      }
    }
  }, [addonServiceTypeId, serviceTypes]);

  function addItem() {
    isDirtyRef.current = true;
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        label: "",
        price: "",
        components: [{ id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
        autoLabel: true,
      },
    ]);
  }
  function removeItem(index: number) {
    isDirtyRef.current = true;
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) {
        return [
          {
            id: Math.random().toString(36).slice(2),
            label: "",
            price: "",
            components: [{ id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
            autoLabel: true,
          },
        ];
      }
      return next;
    });
  }
  function setItemLabel(index: number, value: string) {
    isDirtyRef.current = true;
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it;
        const previousLabel = it.label ?? "";
        const previousSuggestion = getMixPriceSuggestion(previousLabel ?? "");
        const currentPriceNumeric = parsePriceValue(it.price);
        const usedPreviousSuggestion =
          previousSuggestion != null && currentPriceNumeric != null && currentPriceNumeric === previousSuggestion;
        const hadPriceBefore = hasPriceValue(it.price);

        const next: ItemGroup = { ...it, label: value, autoLabel: true };
        if (next.components.length > 1) {
          const suggestion = getMixPriceSuggestion(value);
          const shouldReplaceWithSuggestion = suggestion != null && (usedPreviousSuggestion || !hadPriceBefore);
          if (shouldReplaceWithSuggestion && suggestion != null) {
            next.price = String(suggestion);
          } else if (usedPreviousSuggestion && suggestion == null) {
            next.price = FALLBACK_MIX_PRICE;
          } else if (!usedPreviousSuggestion && !hadPriceBefore) {
            next.price = FALLBACK_MIX_PRICE;
          }
          if (next.label && next.price) {
            rememberMixPrice(next.label, next.price);
          }
        }
        return next;
      }),
    );
  }
  function setItemPrice(index: number, value: string) {
    const digitsOnly = String(value ?? "").replace(/[^0-9]/g, "");
    isDirtyRef.current = true;
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it;
        const next = { ...it, price: digitsOnly };
        if (next.components.length > 1 && next.label && digitsOnly) {
          rememberMixPrice(next.label, digitsOnly);
        }
        return next;
      }),
    );
  }

  const formatThousands = (digits: string | undefined) => {
    const raw = String(digits ?? "").replace(/[^0-9]/g, "");
    if (!raw) return "";
    return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  function addComponent(itemIdx: number) {
    isDirtyRef.current = true;
    setItems((prev) =>
      prev.map((it, i) =>
        i === itemIdx
          ? (() => {
              const nextComponents = [
                ...it.components,
                { id: Math.random().toString(36).slice(2), productId: "", quantity: "" },
              ];
              let nextPrice = it.price ?? "";
              if (nextComponents.length > 1) {
                const suggestion = getMixPriceSuggestion(it.label ?? "");
                if (!hasPriceValue(it.price)) {
                  if (suggestion != null) {
                    nextPrice = String(suggestion);
                  } else {
                    nextPrice = FALLBACK_MIX_PRICE;
                  }
                }
              }
              const nextItem: ItemGroup = {
                ...it,
                components: nextComponents,
                price: nextPrice,
                autoLabel: it.autoLabel,
              };
              if (nextComponents.length > 1 && nextItem.label && nextPrice) {
                rememberMixPrice(nextItem.label, nextPrice);
              }
              return nextItem;
            })()
          : it,
      ),
    );
  }
  function removeComponent(itemIdx: number, compIdx: number) {
    isDirtyRef.current = true;
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== itemIdx) return it;
        const nextComps = it.components.filter((_, j) => j !== compIdx);
        return {
          ...it,
          components:
            nextComps.length > 0
              ? nextComps
              : [{ id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
        };
      }),
    );
  }
  function setComponent(itemIdx: number, compIdx: number, key: "productId" | "quantity", value: string) {
    isDirtyRef.current = true;
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== itemIdx) return it;

        const previousFirstProductId = it.components?.[0]?.productId ?? "";
        const previousFirstProductName = productsList.find(
          (x) => String(x.id) === String(previousFirstProductId),
        )?.name;

        const updatedComponents = it.components.map((c, j) => (j === compIdx ? { ...c, [key]: value } : c));

        let updatedLabel = it.label ?? "";
        let updatedAutoLabel = true;
        if (key === "productId" && compIdx === 0) {
          const newFirstProductName = productsList.find((x) => String(x.id) === value)?.name ?? "";
          updatedLabel = newFirstProductName;
        }
        const previousLabel = it.label ?? "";
        const previousSuggestion = getMixPriceSuggestion(previousLabel ?? "");
        const currentPriceNumeric = parsePriceValue(it.price);
        const usedPreviousSuggestion =
          previousSuggestion != null && currentPriceNumeric != null && currentPriceNumeric === previousSuggestion;
        const hadPriceBefore = hasPriceValue(it.price);
        let updatedPrice = it.price ?? "";
        const isMix = updatedComponents.length > 1;
        const labelChanged = updatedLabel !== (it.label ?? "");
        const becameMix = isMix && it.components.length <= 1;
        if (isMix && (labelChanged || becameMix)) {
          const suggestion = getMixPriceSuggestion(updatedLabel);
          const allowAuto = (updatedAutoLabel ?? true) && !hadPriceBefore;
          const shouldReplaceWithSuggestion = suggestion != null && (usedPreviousSuggestion || allowAuto);
          if (shouldReplaceWithSuggestion && suggestion != null) {
            updatedPrice = String(suggestion);
          } else if (usedPreviousSuggestion && suggestion == null) {
            updatedPrice = FALLBACK_MIX_PRICE;
          } else if (!usedPreviousSuggestion && allowAuto) {
            updatedPrice = FALLBACK_MIX_PRICE;
          }
        }
        const next: ItemGroup = {
          ...it,
          components: updatedComponents,
          label: updatedLabel,
          price: updatedPrice,
          autoLabel: updatedAutoLabel,
        };
        if (isMix && next.label && next.price) {
          rememberMixPrice(next.label, next.price);
        }
        return next;
      }),
    );
  }
  // Removed mix template handlers
  function setQuickMixComponent(index: number, key: "productId" | "quantity", value: string) {
    setQuickMix((prev) => ({
      ...prev,
      components: prev.components.map((c, i) => (i === index ? { ...c, [key]: value } : c)),
    }));
  }
  function addQuickMixComponent() {
    setQuickMix((prev) => ({
      ...prev,
      components: [...prev.components, { id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
    }));
  }
  function removeQuickMixComponent(index: number) {
    setQuickMix((prev) => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index),
    }));
  }

  function toOptionalString(value: string) {
    return value ? value : undefined;
  }
  async function submit() {
    const toNumberSafe = (v: unknown): number => {
      const n = typeof v === "number" ? v : Number(v ?? 0);
      return Number.isFinite(n) ? n : 0;
    };
    const toPrimaryQty = (productId: string, qtyInnerStr: string): string => {
      const prod = productsList.find((x) => String(x.id) === productId);
      const denom = prod?.unitContentAmount ? Number(prod.unitContentAmount) : undefined;
      const qtyInner = toNumberSafe(qtyInnerStr);
      if (denom && denom > 0) return String(qtyInner / denom);
      return String(qtyInner);
    };
    const body = {
      visitDate: toOptionalString(visitDate),
      weight: toOptionalString(weight),
      temperature: toOptionalString(temperature),
      notes: toOptionalString(notes),
      doctorId: doctorId ? Number(doctorId) : undefined,
      paravetId: paravetId ? Number(paravetId) : undefined,
      adminId: adminId ? Number(adminId) : undefined,
      groomerId: groomerId ? Number(groomerId) : undefined,
      urine: toOptionalString(urine),
      defecation: toOptionalString(defecation),
      appetite: toOptionalString(appetite),
      condition: toOptionalString(condition),
      symptoms: toOptionalString(symptoms),
      products: items.flatMap((it) => {
        const isMix = it.components.length > 1;
        if (isMix) return [];
        return it.components
          .filter((c) => c.productId && c.quantity)
          .map((c) => ({ productId: Number(c.productId), quantity: String(Number(c.quantity || 0)) }));
      }),
    };
    if (editing) {
      // Build replace-all payload
      const singles = items
        .filter((it) => it.components.length === 1)
        .flatMap((it) =>
          it.components
            .filter((c) => c.productId && c.quantity)
            .map((c) => ({ productId: Number(c.productId), quantity: String(Number(c.quantity || 0)) })),
        );
      const mixesPayload = items
        .filter((it) => it.components.length > 1)
        .map((it) => ({
          label: it.label,
          price: it.price,
          components: it.components
            .filter((c) => c.productId && c.quantity)
            .map((c) => ({ productId: Number(c.productId), quantity: String(Number(c.quantity || 0)) })),
        }))
        .filter((m) => m.components.length > 0);

      const meta: any = {
        visitDate: toOptionalString(visitDate),
        weight: toOptionalString(weight),
        temperature: toOptionalString(temperature),
        notes: toOptionalString(notes),
        doctorId: doctorId ? Number(doctorId) : undefined,
        paravetId: paravetId ? Number(paravetId) : undefined,
        adminId: adminId ? Number(adminId) : undefined,
        groomerId: groomerId ? Number(groomerId) : undefined,
        urine: toOptionalString(urine),
        defecation: toOptionalString(defecation),
        appetite: toOptionalString(appetite),
        condition: toOptionalString(condition),
        symptoms: toOptionalString(symptoms),
      };
      const res = await fetch(`/api/bookings/${bookingId}/pets/${bookingPetId}/visits/${editVisitId}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meta, singles, mixes: mixesPayload }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        toast.error(txt || "Gagal menyimpan perubahan visit");
        return;
      }
      // Addon (opsional) setelah replace-all
      if (addonServiceTypeId) {
        const when = visitDate || new Date().toISOString().slice(0, 16);
        const whenIso = new Date(when).toISOString();
        await fetch(`/api/bookings/${bookingId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceTypeId: Number(addonServiceTypeId),
            quantity: 1,
            role: "ADDON",
            startDate: whenIso,
            endDate: whenIso,
          }),
        }).catch(() => {});
      }
      toast.success("Perubahan visit disimpan");
      router.push(`/dashboard/bookings/${bookingId}/visit/history`);
    } else {
      const res = await fetch(`/api/bookings/${bookingId}/pets/${bookingPetId}/visits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        toast.error("Gagal menyimpan visit");
        return;
      }
      const saved = await res.json().catch(() => null);
      if (addonServiceTypeId) {
        const when = visitDate || new Date().toISOString().slice(0, 16);
        const whenIso = new Date(when).toISOString();
        await fetch(`/api/bookings/${bookingId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceTypeId: Number(addonServiceTypeId),
            quantity: 1,
            role: "ADDON",
            startDate: whenIso,
            endDate: whenIso,
          }),
        }).catch(() => {});
      }
      for (const it of items) {
        const isMix = it.components.length > 1;
        const comps = it.components.filter((c) => c.productId && c.quantity);
        if (isMix && comps.length !== it.components.length) {
          toast.error("Lengkapi semua sub-item (produk dan qty) untuk Mix");
          return;
        }
        if (!isMix || comps.length === 0) continue;
        const qmRes = await fetch(`/api/bookings/${bookingId}/pets/${bookingPetId}/quick-mix`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mixName: it.label && it.label.trim().length ? it.label : `Mix - ${new Date().toISOString().slice(0, 10)}`,
            price: it.price === "" ? undefined : it.price,
            components: comps.map((c) => ({
              productId: Number(c.productId),
              quantity: String(Number(c.quantity || 0)),
            })),
            visitId: saved?.id,
          }),
        });
        if (!qmRes.ok) {
          const errText = await qmRes.text().catch(() => "");
          toast.error(errText || "Gagal menyimpan Mix Item");
          return;
        }
      }
      toast.success("Visit tersimpan");
      setVisitDate("");
      setWeight("");
      setTemperature("");
      setNotes("");
      setDoctorId("");
      setUrine("");
      setDefecation("");
      setAppetite("");
      setCondition("");
      setSymptoms("");
      setItems([
        {
          id: Math.random().toString(36).slice(2),
          label: "",
          components: [{ id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
        },
      ]);
      setQuickMix({
        name: "",
        price: "",
        components: [{ id: Math.random().toString(36).slice(2), productId: "", quantity: "" }],
      });
      setAddonServiceTypeId("");
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editing ? "Edit Visit" : "Tambah Visit"}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {/* Header - Pemilik & Pet (Read-only) */}
        <div className="bg-muted/50 flex items-center gap-4 rounded-md px-4 py-3">
          <div className="font-medium">
            Pemilik: <span className="font-normal">{ownerName ?? "-"}</span>
          </div>
          <div className="text-muted-foreground">•</div>
          <div className="font-medium">
            Pet: <span className="font-normal">{petName ?? "-"}</span>
          </div>
        </div>

        {/* INFORMASI VISIT */}
        <div className="grid gap-3 rounded-md border p-3">
          <div className="text-sm font-medium">INFORMASI VISIT</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <Label className="mb-2 block text-xs">Tanggal Visit (opsional)</Label>
              <Input
                type="datetime-local"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                min={minDate}
                max={maxDate}
              />
            </div>
            <div>
              <Label className="mb-2 block text-xs">Berat (kg)</Label>
              <Input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="5.2" />
            </div>
            <div>
              <Label className="mb-2 block text-xs">Suhu (°C)</Label>
              <Input value={temperature} onChange={(e) => setTemperature(e.target.value)} placeholder="38.5" />
            </div>
            <div>
              <Label className="mb-2 block text-xs">Addon (opsional)</Label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={addonServiceTypeId}
                onChange={(e) => setAddonServiceTypeId(e.target.value)}
              >
                <option value="">Pilih Addon</option>
                {serviceTypes.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <Label className="mb-2 block text-xs">Nama Dokter</Label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
              >
                <option value="">Pilih Nama Dokter</option>
                {doctors.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-2 block text-xs">Nama Paravet</Label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={paravetId}
                onChange={(e) => setParavetId(e.target.value)}
              >
                <option value="">Pilih Nama Paravet</option>
                {paravets.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-2 block text-xs">Admin (opsional)</Label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
              >
                <option value="">Pilih Admin</option>
                {admins.map((a) => (
                  <option key={a.id} value={String(a.id)}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            {isGrooming && (
              <div>
                <Label className="mb-2 block text-xs">Groomer (opsional)</Label>
                <select
                  className="w-full rounded-md border px-3 py-2"
                  value={groomerId}
                  onChange={(e) => setGroomerId(e.target.value)}
                >
                  <option value="">Pilih Groomer</option>
                  {groomers.map((g) => (
                    <option key={g.id} value={String(g.id)}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* PEMERIKSAAN FISIK */}
        <div className="grid gap-3 rounded-md border p-3">
          <div className="text-sm font-medium">PEMERIKSAAN FISIK</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <Label className="mb-2 block text-xs">Urine</Label>
              <Input value={urine} onChange={(e) => setUrine(e.target.value)} placeholder="" />
            </div>
            <div>
              <Label className="mb-2 block text-xs">Def</Label>
              <Input value={defecation} onChange={(e) => setDefecation(e.target.value)} placeholder="" />
            </div>
            <div>
              <Label className="mb-2 block text-xs">App</Label>
              <Input value={appetite} onChange={(e) => setAppetite(e.target.value)} placeholder="" />
            </div>
          </div>
        </div>

        {/* KONDISI & GEJALA */}
        <div className="grid gap-3 rounded-md border p-3">
          <div className="text-sm font-medium">KONDISI & GEJALA</div>
          <div>
            <Label className="mb-2 block text-xs">Kondisi</Label>
            <Textarea value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="Kondisi saat ini" />
          </div>
          <div>
            <Label className="mb-2 block text-xs">Gejala</Label>
            <Textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Gejala" />
          </div>
          <div>
            <Label className="mb-2 block text-xs">Catatan</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan visit" />
          </div>
        </div>
        {/* ITEM */}
        <div className="grid gap-3 rounded-md border p-3">
          <div className="text-sm font-medium">ITEM</div>
          <div className="text-muted-foreground text-xs">Perubahan item tersimpan setelah klik Simpan.</div>
          {items.map((it, i) => (
            <div key={it.id} className="rounded-md border">
              {/* Item Header */}
              <div className="bg-muted/30 flex items-center justify-between border-b px-3 py-2">
                <div className="text-sm font-medium">
                  Item #{i + 1} {it.components.length > 1 ? "(Mix/Racikan)" : ""}
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeItem(i)} disabled={items.length <= 1}>
                  Hapus Item
                </Button>
              </div>

              {/* Item Content */}
              <div className="grid gap-3 p-3">
                {/* Nama Item & Harga Mix */}
                {it.components.length > 1 ? (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <div>
                      <Label className="mb-2 block text-xs">Nama Item (opsional)</Label>
                      <Input
                        value={it.label ?? ""}
                        onChange={(e) => setItemLabel(i, e.target.value)}
                        placeholder="Contoh: Obat Racik A"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block text-xs">Harga Mix (Rp)</Label>
                    <Input
                      value={formatThousands(it.price)}
                      onChange={(e) => setItemPrice(i, e.target.value)}
                      placeholder="Masukkan harga mix"
                      inputMode="decimal"
                    />
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label className="mb-2 block text-xs">Nama Item (opsional)</Label>
                    <Input
                      value={it.label ?? ""}
                      onChange={(e) => setItemLabel(i, e.target.value)}
                      placeholder="Contoh: Obat Racik A"
                    />
                  </div>
                )}

                {/* Sub-items */}
                <div>
                  <Label className="mb-2 block text-xs font-medium">Sub-items:</Label>
                  <div className="grid gap-2">
                    {it.components.map((c, j) => {
                      const prod = productsList.find((x) => String(x.id) === c.productId);
                      const unitLabel = prod?.unitContentName ?? prod?.unit ?? "unit";
                      return (
                        <div key={c.id} className="grid grid-cols-1 gap-2 md:grid-cols-[2fr_2fr_auto]">
                          <div>
                            <MixProductSelect
                              products={productsList.map((p) => ({ id: p.id, name: p.name }))}
                              value={c.productId}
                              onChange={(val) => setComponent(i, j, "productId", val)}
                            />
                          </div>
                          <div className="relative">
                            <Input
                              className="pr-16"
                              placeholder={`Qty`}
                              value={c.quantity}
                              onChange={(e) => setComponent(i, j, "quantity", e.target.value)}
                            />
                            <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs">
                              {it.components.length > 1 ? unitLabel : (prod?.unit ?? unitLabel)}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeComponent(i, j)}
                              disabled={it.components.length <= 1}
                            >
                              Hapus
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button variant="secondary" size="sm" onClick={() => addComponent(i)}>
                      Tambah Sub-item
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            <Button variant="secondary" onClick={addItem}>
              Tambah Item
            </Button>
          </div>
        </div>
        {/* Quick Mix removed */}
        <div className="flex justify-end">
          <Button onClick={submit}>{editing ? "Simpan Perubahan" : "Simpan Visit"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MixProductSelect({
  products,
  value,
  onChange,
}: {
  products: Array<{ id: number; name: string }>;
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const selectedName = React.useMemo(() => {
    const found = products.find((p) => String(p.id) === value);
    return found ? found.name : "Pilih Produk";
  }, [products, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between">
          {selectedName}
          <ChevronsUpDown className="ml-2 size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Cari produk..." />
          <CommandList>
            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {products.map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.name}
                  onSelect={() => {
                    onChange(String(p.id));
                    setOpen(false);
                  }}
                >
                  <Check className={`mr-2 size-4 ${String(p.id) === value ? "opacity-100" : "opacity-0"}`} />
                  {p.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
