"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
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
    () => [
      { header: "Nama", accessorKey: "name" },
      { header: "Jenis", accessorKey: "species" },
      { header: "Ras", accessorKey: "breed" },
      { header: "Pemilik", accessorKey: "ownerName" },
      { header: "Lahir", accessorKey: "birthdate" },
      {
        id: "row-actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }: any) => (
          <div className="flex justify-end gap-2 p-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                const p: PetRow = row.original;
                setEditPet(p);
                setEditForm({ name: p.name, species: p.species, breed: p.breed, birthdate: p.birthdateRaw ?? "" });
              }}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={async (e) => {
                e.stopPropagation();
                if (!confirm("Hapus hewan ini?")) return;
                await fetch(`/api/owners/pets/${row.original.id}`, { method: "DELETE" });
                await load(data.page, data.pageSize);
              }}
            >
              Hapus
            </Button>
          </div>
        ),
      },
    ],
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
    breed: z.string().min(1),
    birthdate: z.string().min(1),
  });
  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: { ownerId: 0, name: "", species: "", breed: "", birthdate: "" },
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
    const records = Array.isArray(viewDetail?.records) ? viewDetail.records : [];
    return records.reduce((sum: number, r: any) => sum + (Array.isArray(r?.visits) ? r.visits.length : 0), 0);
  }, [viewDetail]);

  async function onCreate(values: z.infer<typeof Schema>) {
    const res = await fetch(`/api/owners/${values.ownerId}/pets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        species: values.species,
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
                          <FormControl>
                            <Input placeholder="Kucing/Anjing" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
              columns={table.options.columns as any}
              onRowClick={(row: PetRow) => setViewPet(row)}
            />
          </div>
          <DataTablePagination table={table} />
        </CardContent>
      </Card>

      <Dialog open={!!viewPet} onOpenChange={(o) => !o && setViewPet(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detail Hewan & Rekam Medis</DialogTitle>
          </DialogHeader>
          {viewDetail ? (
            <div className="grid gap-4 text-sm">
              <div className="rounded-md border p-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-muted-foreground">Nama</div>
                  <div className="col-span-2 font-medium">{viewDetail.pet?.name ?? viewPet?.name}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-muted-foreground">Pemilik</div>
                  <div className="col-span-2">{viewDetail.pet?.owner?.name ?? viewPet?.ownerName ?? "-"}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-muted-foreground">Jenis</div>
                  <div className="col-span-2">{viewDetail.pet?.species ?? viewPet?.species ?? "-"}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-muted-foreground">Ras</div>
                  <div className="col-span-2">{viewDetail.pet?.breed ?? viewPet?.breed ?? "-"}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-muted-foreground">Lahir</div>
                  <div className="col-span-2">
                    {viewDetail.pet?.birthdate
                      ? new Date(viewDetail.pet.birthdate).toLocaleDateString()
                      : (viewPet?.birthdate ?? "-")}
                  </div>
                </div>
                <div className="mt-2 text-right text-sm font-semibold">Total kunjungan: {visitCount} kali</div>
              </div>

              <div className="grid gap-3">
                {Array.isArray(viewDetail.records) && viewDetail.records.length ? (
                  viewDetail.records.map((rec: any) => (
                    <div key={rec.id} className="rounded-md border p-3">
                      <div className="text-muted-foreground mb-2 text-xs">
                        Booking #{rec.bookingId} • {rec.booking?.serviceType?.name ?? "Layanan"}
                      </div>
                      {Array.isArray(rec.examinations) && rec.examinations.length ? (
                        <div className="grid gap-2">
                          <div className="text-sm font-medium">Pemeriksaan</div>
                          <div className="grid gap-2">
                            {rec.examinations.map((ex: any) => (
                              <RecordExamDetail key={ex.id} ex={ex} />
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {Array.isArray(rec.visits) && rec.visits.length ? (
                        <div className="mt-3 grid gap-2">
                          <div className="text-sm font-medium">Visits</div>
                          <div className="grid gap-2">
                            {rec.visits.map((v: any) => (
                              <RecordVisitDetail key={v.id} v={v} />
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground text-xs">Belum ada rekam medis</div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">Memuat...</div>
          )}
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

function RecordExamDetail({ ex }: { ex: any }) {
  const products = Array.isArray(ex.productUsages) ? ex.productUsages : [];
  const total = products.reduce((s: number, pu: any) => s + Number(pu.quantity) * Number(pu.unitPrice ?? 0), 0);
  return (
    <div className="grid gap-2 text-xs">
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
      <div className="mt-1 text-right text-sm font-semibold">Total: Rp {total.toLocaleString("id-ID")}</div>
    </div>
  );
}

function RecordVisitDetail({ v }: { v: any }) {
  const prod = Array.isArray(v.productUsages) ? v.productUsages : [];
  const mix = Array.isArray(v.mixUsages) ? v.mixUsages : [];
  const total =
    prod.reduce((s: number, pu: any) => s + Number(pu.quantity) * Number(pu.unitPrice ?? 0), 0) +
    mix.reduce((s: number, mu: any) => s + Number(mu.quantity) * Number(mu.unitPrice ?? mu.mixProduct?.price ?? 0), 0);
  return (
    <div className="grid gap-2 text-xs">
      <div>Tanggal: {new Date(v.visitDate).toLocaleString()}</div>
      <div>Dokter: {v.doctor?.name ?? "-"}</div>
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
      <div className="mt-1 text-right text-sm font-semibold">Total: Rp {total.toLocaleString("id-ID")}</div>
    </div>
  );
}
