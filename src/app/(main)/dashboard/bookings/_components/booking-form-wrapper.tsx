"use client";

import * as React from "react";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { BookingForm } from "../new/_components/booking-form";

type Service = { id: number; name: string };
type Owner = { id: number; name: string; phone?: string | null };

export function BookingFormWrapper() {
  const [open, setOpen] = React.useState(false);
  const [services, setServices] = React.useState<Service[]>([]);
  const [owners, setOwners] = React.useState<Owner[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  // Lazy load data only when form is opened
  React.useEffect(() => {
    if (!open || loaded) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [servicesRes, ownersRes] = await Promise.all([
          fetch("/api/services", { cache: "no-store" }),
          fetch("/api/owners?page=1&pageSize=20", { cache: "no-store" }),
        ]);

        const [servicesData, ownersData] = await Promise.all([
          servicesRes.ok ? servicesRes.json() : [],
          ownersRes.ok ? ownersRes.json() : { items: [] },
        ]);

        setServices(Array.isArray(servicesData) ? servicesData : []);
        setOwners(Array.isArray(ownersData?.items) ? ownersData.items : []);
        setLoaded(true);
      } catch {
        setServices([]);
        setOwners([]);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [open, loaded]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center justify-end">
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <span>Buat Booking Baru</span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="pt-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground text-sm">Memuat form...</div>
          </div>
        ) : loaded ? (
          <BookingForm services={services} owners={owners} onSuccess={() => setOpen(false)} />
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
