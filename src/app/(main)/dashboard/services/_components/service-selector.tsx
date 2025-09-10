"use client";

/* eslint-disable import/order */
import * as React from "react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Service = { id: number; name: string };
type ServiceType = { id: number; name: string; price: number | null; pricePerDay: number | null };

export function ServiceSelector({ initialServices }: { initialServices: Service[] }) {
  const [services] = React.useState<Service[]>(initialServices);
  const [serviceId, setServiceId] = React.useState<string>("");
  const router = useRouter();

  const [form, setForm] = React.useState<{ name: string; price: string; pricePerDay: string }>({
    name: "",
    price: "",
    pricePerDay: "",
  });

  // Tidak menampilkan list di kartu ini; list ada di tabel.

  async function submitNew() {
    if (!serviceId) {
      toast.error("Pilih service terlebih dulu");
      return;
    }
    const res = await fetch("/api/service-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: Number(serviceId),
        name: form.name,
        price: form.price,
        pricePerDay: form.pricePerDay || null,
      }),
    });
    if (!res.ok) {
      toast.error("Gagal menambah service type");
      return;
    }
    toast.success("Service type ditambahkan");
    setForm({ name: "", price: "", pricePerDay: "" });
    router.refresh();
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Kelola Service Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">Service</label>
              <Select value={serviceId} onValueChange={(v) => setServiceId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input
              placeholder="Nama"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            />
            <Input
              placeholder="Harga (string)"
              value={form.price}
              onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
            />
            <Input
              placeholder="Harga per hari (opsional)"
              value={form.pricePerDay}
              onChange={(e) => setForm((s) => ({ ...s, pricePerDay: e.target.value }))}
            />
            <Button onClick={submitNew} disabled={!serviceId}>
              Tambah
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
