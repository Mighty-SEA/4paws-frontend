"use client";

import * as React from "react";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { smartFilterFn, withIndexColumn } from "@/components/data-table/table-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

type PetRow = {
  id: number;
  name: string;
  species: string;
  breed: string;
  ownerName: string;
  birthdate: string;
  birthdateRaw?: string;
};

export function PetTable() {
  const [data, setData] = React.useState<{ items: PetRow[]; total: number; page: number; pageSize: number }>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
  });

  const columns = React.useMemo(
    () =>
      withIndexColumn<PetRow>([
        { header: "Nama", accessorKey: "name", filterFn: smartFilterFn },
        { header: "Jenis", accessorKey: "species", filterFn: smartFilterFn },
        { header: "Ras", accessorKey: "breed", filterFn: smartFilterFn },
        { header: "Pemilik", accessorKey: "ownerName", filterFn: smartFilterFn },
        { header: "Lahir", accessorKey: "birthdate" },
        {
          id: "row-actions",
          header: () => <span className="sr-only">Actions</span>,
          cell: ({ row }) => {
            const role = (typeof window !== "undefined" && (window as any).userRole) as unknown;
            const isAdmin = String(role ?? "").toUpperCase() === "ADMIN";
            return (
              <div className="flex justify-end gap-2 p-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    const p = row.original;
                    setEditPet(p);
                    setEditForm({ name: p.name, species: p.species, breed: p.breed, birthdate: p.birthdateRaw ?? "" });
                  }}
                >
                  Edit
                </Button>
                {isAdmin ? null : (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!confirm("Hapus hewan ini?")) return;
                      const res = await fetch(`/api/owners/pets/${row.original.id}`, { method: "DELETE" });
                      if (!res.ok) {
                        const txt = await res.text().catch(() => "");
                        toast.error(txt || "Gagal menghapus hewan");
                      } else {
                        toast.success("Hewan dihapus");
                        await load(data.page, data.pageSize);
                      }
                    }}
                  >
                    Hapus
                  </Button>
                )}
              </div>
            );
          },
        },
      ]),
    [data.page, data.pageSize],
  );

  async function load(page: number, pageSize: number) {
    const res = await fetch(`/api/owners/pets?page=${page}&pageSize=${pageSize}`, { cache: "no-store" });
    if (!res.ok) return;
    const json = await res.json();
    const items: PetRow[] = Array.isArray(json.items)
      ? json.items.map((p: any) => ({
          id: p.id,
          name: p.name,
          species: p.species,
          breed: p.breed,
          ownerName: p.owner?.name ?? String(p.ownerId),
          birthdate: p.birthdate ? new Date(p.birthdate).toLocaleDateString() : "",
          birthdateRaw: p.birthdate ? new Date(p.birthdate).toISOString().slice(0, 10) : "",
        }))
      : [];
    setData({ items, total: json.total ?? items.length, page: json.page ?? page, pageSize: json.pageSize ?? pageSize });
  }

  React.useEffect(() => {
    load(1, 10);
  }, []);

  const Schema = z.object({
    ownerId: z.coerce.number().min(1, { message: "Pilih pemilik" }),
    name: z.string().min(1),
    species: z.string().min(1),
    speciesOther: z.string().optional(),
    breed: z.string().min(1),
    birthdate: z.string().min(1),
  });
  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: { ownerId: 0, name: "", species: "", speciesOther: "", breed: "", birthdate: "" },
  });

  const [owners, setOwners] = React.useState<Array<{ id: number; name: string }>>([]);
  React.useEffect(() => {
    (async () => {
      const res = await fetch(`/api/owners?page=1&pageSize=1000`, { cache: "no-store" });
      const json = await res.json().catch(() => ({ items: [] }));
      const items = Array.isArray(json.items) ? json.items : [];
      setOwners(items.map((o: any) => ({ id: o.id, name: o.name })));
    })();
  }, []);

  const [editPet, setEditPet] = React.useState<PetRow | null>(null);
  const [editForm, setEditForm] = React.useState<{ name: string; species: string; breed: string; birthdate: string }>({
    name: "",
    species: "",
    breed: "",
    birthdate: "",
  });

  const [viewPet, setViewPet] = React.useState<PetRow | null>(null);
  const [viewDetail, setViewDetail] = React.useState<any | null>(null);
  const [selectedExam, setSelectedExam] = React.useState<null | { exam: any; visits: any[]; bookingId?: number }>(null);
  const [selectedExamBookingTotal, setSelectedExamBookingTotal] = React.useState<number | null>(null);
  const [selectedVisit, setSelectedVisit] = React.useState<any | null>(null);

  React.useEffect(() => {
    (async () => {
      if (!viewPet) {
        setViewDetail(null);
        return;
      }
      try {
        const res = await fetch(`/api/owners/pets/${viewPet.id}/medical-records`, { cache: "no-store" });
        if (!res.ok) {
          setViewDetail(null);
          return;
        }
        const json = await res.json().catch(() => null);
        setViewDetail(json);
      } catch {
        setViewDetail(null);
      }
    })();
  }, [viewPet]);

  const visitCount = React.useMemo(() => {
    // Total kunjungan = jumlah booking yang pernah dibuat untuk hewan ini
    const records = Array.isArray(viewDetail?.records) ? viewDetail.records : [];
    return records.length;
  }, [viewDetail]);

  const timeline = React.useMemo(() => {
    const records = Array.isArray(viewDetail?.records) ? viewDetail.records : [];
    const list: Array<{
      id: string;
      type: "EXAM";
      date: string;
      serviceName?: string;
      bookingId?: number;
      data: any;
      metaVisits?: any[];
    }> = [];
    for (const rec of records) {
      const serviceName = rec?.booking?.serviceType?.name;
      const bookingId = rec?.bookingId ?? rec?.booking?.id;
      const exams = Array.isArray(rec?.examinations) ? rec.examinations : [];
      const visits = Array.isArray(rec?.visits) ? rec.visits : [];
      for (const ex of exams) {
        const dateStr = (ex.createdAt ?? ex.updatedAt ?? ex.examDate ?? ex.createdAt) as string | undefined;
        if (dateStr)
          list.push({
            id: `E-${ex.id}`,
            type: "EXAM",
            date: dateStr,
            serviceName,
            bookingId,
            data: ex,
            metaVisits: visits,
          });
      }
    }
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [viewDetail]);

  // Load booking estimate total when exam modal opens
  const selectedExamBookingId = selectedExam?.bookingId;
  React.useEffect(() => {
    (async () => {
      if (!selectedExamBookingId) {
        setSelectedExamBookingTotal(null);
        return;
      }
      try {
        const res = await fetch(`/api/bookings/${selectedExamBookingId}/billing/estimate`, { cache: "no-store" });
        if (!res.ok) {
          setSelectedExamBookingTotal(null);
          return;
        }
        const json = await res.json().catch(() => null);
        setSelectedExamBookingTotal(Number(json?.total ?? 0));
      } catch {
        setSelectedExamBookingTotal(null);
      }
    })();
  }, [selectedExamBookingId]);

  async function onCreate(values: z.infer<typeof Schema>) {
    const speciesValue =
      values.species === "Lain-lain" && values.speciesOther?.trim().length
        ? values.speciesOther.trim()
        : values.species;
    const res = await fetch(`/api/owners/${values.ownerId}/pets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        species: speciesValue,
        breed: values.breed,
        birthdate: values.birthdate,
      }),
    });
    if (!res.ok) {
      toast.error("Gagal menambah hewan");
      return;
    }
    toast.success("Hewan ditambahkan");
    form.reset();
    await load(1, data.pageSize);
  }

  // removed medical record modal in this view for simplicity

  const table = useDataTableInstance<PetRow, unknown>({
    data: data.items,
    columns: columns as any,
    getRowId: (row) => String(row.id),
  });

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pets</CardTitle>
              <CardDescription>Kelola data hewan peliharaan.</CardDescription>
            </div>
            <DataTableViewOptions table={table} />
          </div>
          <CardAction>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Tambah Hewan</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Hewan</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onCreate)} className="grid gap-3 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="ownerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pemilik</FormLabel>
                          <Select
                            onValueChange={(v) => field.onChange(Number(v))}
                            value={field.value ? String(field.value) : undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih pemilik" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {owners.map((o) => (
                                <SelectItem key={o.id} value={String(o.id)}>
                                  {o.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Hewan</FormLabel>
                          <FormControl>
                            <Input placeholder="Cemong" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="species"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jenis</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih jenis" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Kucing">Kucing</SelectItem>
                              <SelectItem value="Anjing">Anjing</SelectItem>
                              <SelectItem value="Kelinci">Kelinci</SelectItem>
                              <SelectItem value="Lain-lain">Lain-lain</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {form.watch("species") === "Lain-lain" ? (
                      <FormField
                        control={form.control}
                        name="speciesOther"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Jenis Lainnya</FormLabel>
                            <FormControl>
                              <Input placeholder="Masukkan jenis hewan" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : null}
                    <FormField
                      control={form.control}
                      name="breed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ras</FormLabel>
                          <FormControl>
                            <Input placeholder="Domestic" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="birthdate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tanggal Lahir</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="md:col-span-2">
                      <Button type="submit" className="w-full">
                        Simpan
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardAction>
        </CardHeader>
        <CardContent className="flex size-full flex-col gap-4">
          <div className="flex items-center gap-2">
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Cari hewan (nama/jenis/ras/pemilik)"
              onChange={(e) => {
                const v = e.target.value;
                table.getColumn("name")?.setFilterValue(v);
              }}
            />
          </div>
          <div className="overflow-hidden rounded-md border">
            <DataTable
              table={table}
              columns={columns as any}
              onRowClick={(row: PetRow) => {
                window.location.href = `/dashboard/pets/${row.id}`;
              }}
            />
          </div>
          <DataTablePagination table={table} />
        </CardContent>
      </Card>

      {null}

      <Dialog open={!!selectedExam} onOpenChange={(o) => !o && setSelectedExam(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Pemeriksaan</DialogTitle>
          </DialogHeader>
          {selectedExam ? (
            <div className="grid gap-3">
              <RecordExamDetail
                ex={selectedExam.exam}
                visits={selectedExam.visits}
                bookingTotal={selectedExamBookingTotal ?? undefined}
              />
              {selectedExam.bookingId ? (
                <div className="flex justify-end">
                  <Button asChild variant="outline">
                    <Link href={`/dashboard/bookings/${selectedExam.bookingId}`}>Detail</Link>
                  </Button>
                </div>
              ) : null}
              <div className="grid gap-2">
                <div className="text-sm font-medium">Visit Harian</div>
                {(() => {
                  const groups = (() => {
                    const map = new Map<string, any[]>();
                    (selectedExam.visits ?? []).forEach((v: any) => {
                      const d = new Date(v.visitDate ?? v.createdAt);
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
                  })();
                  if (!groups.length) return <div className="text-muted-foreground text-xs">Belum ada visit</div>;
                  return (
                    <div className="grid gap-2">
                      {groups.map((g) => (
                        <div key={g.date} className="rounded-md border p-2 text-xs">
                          <div className="mb-1 font-medium">
                            {(() => {
                              const [y, m, d] = g.date.split("-");
                              return `${d}/${m}/${y}`;
                            })()}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {g.list.map((v: any) => (
                              <Button
                                key={v.id}
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // Attach addons for this day's booking items
                                  const dayKey = new Date(v.visitDate ?? v.createdAt).toISOString().slice(0, 10);
                                  const bookingItems = (selectedExam?.exam?.booking?.items ?? []) as any[];
                                  const addons = bookingItems.filter((it: any) => {
                                    if (it?.role !== "ADDON") return false;
                                    const sd = it?.startDate ? new Date(it.startDate) : null;
                                    const key = sd ? sd.toISOString().slice(0, 10) : null;
                                    return key === dayKey;
                                  });
                                  setSelectedVisit({ ...v, addons });
                                }}
                              >
                                {new Date(v.visitDate ?? v.createdAt).toISOString().slice(11, 16)}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedVisit} onOpenChange={(o) => !o && setSelectedVisit(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Visit Harian</DialogTitle>
          </DialogHeader>
          {selectedVisit ? <RecordVisitDetail v={selectedVisit} /> : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editPet} onOpenChange={(o) => !o && setEditPet(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Hewan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Nama</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Jenis</Label>
              <Input
                value={editForm.species}
                onChange={(e) => setEditForm((f) => ({ ...f, species: e.target.value }))}
              />
            </div>
            <div>
              <Label>Ras</Label>
              <Input value={editForm.breed} onChange={(e) => setEditForm((f) => ({ ...f, breed: e.target.value }))} />
            </div>
            <div>
              <Label>Lahir</Label>
              <Input
                type="date"
                value={editForm.birthdate}
                onChange={(e) => setEditForm((f) => ({ ...f, birthdate: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 md:col-span-2">
              <Button variant="outline" onClick={() => setEditPet(null)}>
                Batal
              </Button>
              <Button
                onClick={async () => {
                  if (!editPet) return;
                  await fetch(`/api/owners/pets/${editPet.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(editForm),
                  });
                  setEditPet(null);
                  await load(data.page, data.pageSize);
                }}
              >
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RecordExamDetail({ ex, visits = [], bookingTotal }: { ex: any; visits?: any[]; bookingTotal?: number }) {
  const products = Array.isArray(ex.productUsages) ? ex.productUsages : [];
  const totalProducts = products.reduce((s: number, pu: any) => s + Number(pu.quantity) * Number(pu.unitPrice ?? 0), 0);
  const visitsTotal = (Array.isArray(visits) ? visits : []).reduce((sum: number, v: any) => {
    const prod = Array.isArray(v.productUsages) ? v.productUsages : [];
    const mix = Array.isArray(v.mixUsages) ? v.mixUsages : [];
    const pSum = prod.reduce((s: number, pu: any) => s + Number(pu.quantity) * Number(pu.unitPrice ?? 0), 0);
    const mSum = mix.reduce(
      (s: number, mu: any) => s + Number(mu.quantity) * Number(mu.unitPrice ?? mu.mixProduct?.price ?? 0),
      0,
    );
    return sum + pSum + mSum;
  }, 0);
  const total = bookingTotal ?? totalProducts + visitsTotal;
  return (
    <div className="grid gap-2 text-xs">
      <div className="flex items-center justify-between">
        <div>{ex.createdAt ? new Date(ex.createdAt).toLocaleString() : ""}</div>
        <div className="text-muted-foreground">
          Dokter: {ex.doctor?.name ?? "-"} · Paravet: {ex.paravet?.name ?? "-"} · Admin: {ex.admin?.name ?? "-"} ·
          Groomer: {ex.groomer?.name ?? "-"}
        </div>
      </div>
      <div className="grid gap-1">
        <div className="text-muted-foreground">Keluhan</div>
        <div>{ex.chiefComplaint ?? "-"}</div>
      </div>
      {ex.additionalNotes ? (
        <div className="grid gap-1">
          <div className="text-muted-foreground">Catatan Tambahan</div>
          <div>{ex.additionalNotes}</div>
        </div>
      ) : null}
      <div>
        Berat: {ex.weight ?? "-"} kg, Suhu: {ex.temperature ?? "-"} °C
      </div>
      <div>Catatan: {ex.notes ?? "-"}</div>
      {ex.diagnosis ? (
        <div>
          <span className="text-muted-foreground">Diagnosis:</span> {ex.diagnosis}
        </div>
      ) : null}
      {ex.prognosis ? (
        <div>
          <span className="text-muted-foreground">Prognosis:</span> {ex.prognosis}
        </div>
      ) : null}
      {products.length ? (
        <div className="grid gap-1">
          {products.map((pu: any, i: number) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                {pu.productName} <span className="text-muted-foreground">({pu.quantity})</span>
              </div>
              <div>Rp {Number(pu.unitPrice ?? 0).toLocaleString("id-ID")}</div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="mt-1 text-right text-sm font-semibold">Total Pelayanan: Rp {total.toLocaleString("id-ID")}</div>
    </div>
  );
}

function RecordVisitDetail({ v }: { v: any }) {
  const prod = Array.isArray(v.productUsages) ? v.productUsages : [];
  const mix = Array.isArray(v.mixUsages) ? v.mixUsages : [];
  const addons = Array.isArray(v.addons) ? v.addons : [];
  const addonsCost = addons.reduce((s: number, it: any) => {
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
    prod.reduce((s: number, pu: any) => s + Number(pu.quantity) * Number(pu.unitPrice ?? 0), 0) +
    mix.reduce((s: number, mu: any) => s + Number(mu.quantity) * Number(mu.unitPrice ?? mu.mixProduct?.price ?? 0), 0) +
    addonsCost;
  return (
    <div className="grid gap-2 text-xs">
      <div className="flex items-center justify-between">
        <div>Tanggal: {new Date(v.visitDate).toLocaleString()}</div>
        <div className="text-muted-foreground">
          Dokter: {v.doctor?.name ?? "-"} · Paravet: {v.paravet?.name ?? "-"} · Admin: {v.admin?.name ?? "-"} · Groomer:{" "}
          {v.groomer?.name ?? "-"}
        </div>
      </div>
      <div>
        Berat: {v.weight ?? "-"} kg, Suhu: {v.temperature ?? "-"} °C
      </div>
      <div>Catatan: {v.notes ?? "-"}</div>
      {prod.length ? (
        <div className="grid gap-1">
          {prod.map((pu: any, i: number) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                {pu.productName} <span className="text-muted-foreground">({pu.quantity})</span>
              </div>
              <div>Rp {Number(pu.unitPrice ?? 0).toLocaleString("id-ID")}</div>
            </div>
          ))}
        </div>
      ) : null}
      {mix.length ? (
        <div className="grid gap-1">
          {mix.map((mu: any, i: number) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                {mu.mixProduct?.name ?? `Mix#${mu.mixProductId}`}{" "}
                <span className="text-muted-foreground">({mu.quantity})</span>
              </div>
              <div>Rp {Number(mu.unitPrice ?? mu.mixProduct?.price ?? 0).toLocaleString("id-ID")}</div>
            </div>
          ))}
        </div>
      ) : null}
      {addons.length ? (
        <div className="grid gap-1">
          {addons.map((it: any, i: number) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                {it.serviceType?.name ?? "-"}{" "}
                <span className="text-muted-foreground">({Number(it.quantity ?? 1)})</span>
              </div>
              <div>
                Rp{" "}
                {Number(
                  (it.unitPrice != null && it.unitPrice !== ""
                    ? Number(it.unitPrice)
                    : it.serviceType?.pricePerDay
                      ? Number(it.serviceType.pricePerDay)
                      : Number(it.serviceType?.price ?? 0)) ?? 0,
                ).toLocaleString("id-ID")}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="mt-1 text-right text-sm font-semibold">Total Pelayanan: Rp {total.toLocaleString("id-ID")}</div>
    </div>
  );
}
