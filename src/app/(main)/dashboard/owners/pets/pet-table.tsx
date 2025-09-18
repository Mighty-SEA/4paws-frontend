"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

type PetRow = {
  id: number;
  name: string;
  species: string;
  breed: string;
  ownerName: string;
  birthdate: string;
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
    ],
    [],
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

  const [recordPet, setRecordPet] = React.useState<PetRow | null>(null);
  const [recordData, setRecordData] = React.useState<any | null>(null);
  const [detail, setDetail] = React.useState<null | { type: "exam" | "visit"; data: any }>(null);

  async function openRecords(pet: PetRow) {
    setRecordPet(pet);
    setRecordData(null);
    const res = await fetch(`/api/owners/pets/${pet.id}/medical-records`, { cache: "no-store" });
    if (res.ok) setRecordData(await res.json());
  }

  const table = useDataTableInstance<PetRow, unknown>({
    data: data.items,
    columns: [
      { accessorKey: "name", header: "Nama" },
      { accessorKey: "species", header: "Jenis" },
      { accessorKey: "breed", header: "Ras" },
      { accessorKey: "ownerName", header: "Pemilik" },
      { accessorKey: "birthdate", header: "Lahir" },
    ] as any,
    getRowId: (row) => String(row.id),
  });

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs">
      <Card>
        <CardHeader>
          <CardTitle>Pets</CardTitle>
          <CardDescription>Kelola data hewan peliharaan.</CardDescription>
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
          <div className="overflow-hidden rounded-md border">
            <DataTable
              table={table}
              columns={table.options.columns as any}
              onRowClick={(row) => openRecords(row as any)}
            />
          </div>
          <DataTablePagination table={table} />
        </CardContent>
      </Card>

      <Dialog open={!!recordPet} onOpenChange={(o) => !o && setRecordPet(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rekam Medis {recordPet?.name}</DialogTitle>
          </DialogHeader>
          {recordData ? (
            <div className="grid gap-3 text-sm">
              <div className="grid gap-1">
                <div className="text-muted-foreground">Pemilik</div>
                <div className="font-medium">{recordData.pet?.owner?.name ?? "-"}</div>
              </div>
              <div className="grid gap-1 md:grid-cols-2">
                <div>
                  <div className="text-muted-foreground">Spesies</div>
                  <div>{recordData.pet?.species}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Ras</div>
                  <div>{recordData.pet?.breed}</div>
                </div>
              </div>
              <div className="grid gap-2">
                <div className="text-sm font-semibold">Riwayat Pemeriksaan</div>
                {recordData.records?.flatMap((bp: any) => bp.examinations ?? []).length ? (
                  <div className="grid gap-1">
                    {recordData.records
                      .flatMap((bp: any) => bp.examinations ?? [])
                      .map((ex: any) => (
                        <button
                          key={ex.id}
                          className="hover:bg-muted/40 rounded border p-2 text-left text-xs"
                          onClick={() => setDetail({ type: "exam", data: ex })}
                        >
                          <div>
                            W: {ex.weight ?? "-"} kg, T: {ex.temperature ?? "-"} °C
                          </div>
                          <div>Notes: {ex.notes ?? "-"}</div>
                          {ex.productUsages?.length ? (
                            <div>
                              Produk:{" "}
                              {ex.productUsages.map((pu: any) => `${pu.productName} (${pu.quantity})`).join(", ")}
                            </div>
                          ) : null}
                        </button>
                      ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-xs">Tidak ada pemeriksaan</div>
                )}
              </div>
              <div className="grid gap-2">
                <div className="text-sm font-semibold">Riwayat Rawat Inap/Visit</div>
                {recordData.records?.flatMap((bp: any) => bp.visits ?? []).length ? (
                  <div className="grid gap-1">
                    {recordData.records
                      .flatMap((bp: any) => bp.visits ?? [])
                      .map((v: any) => (
                        <button
                          key={v.id}
                          className="hover:bg-muted/40 rounded border p-2 text-left text-xs"
                          onClick={() => setDetail({ type: "visit", data: v })}
                        >
                          <div>{new Date(v.visitDate).toLocaleString()}</div>
                          <div>Dokter: {v.doctor?.name ?? "-"}</div>
                          {Array.isArray(v.productUsages) && v.productUsages.length ? (
                            <div>
                              Produk:{" "}
                              {v.productUsages.map((pu: any) => `${pu.productName} (${pu.quantity})`).join(", ")}
                            </div>
                          ) : null}
                          {Array.isArray(v.mixUsages) && v.mixUsages.length ? (
                            <div>
                              Mix:{" "}
                              {v.mixUsages
                                .map((mu: any) => `${mu.mixProduct?.name ?? mu.mixProductId} (${mu.quantity})`)
                                .join(", ")}
                            </div>
                          ) : null}
                        </button>
                      ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-xs">Tidak ada rawat inap/visit</div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">Memuat...</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Rekam Medis */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Detail {detail?.type === "exam" ? "Pemeriksaan" : "Visit"}</DialogTitle>
          </DialogHeader>
          {detail ? (
            detail.type === "exam" ? (
              <RecordExamDetail ex={detail.data} />
            ) : (
              <RecordVisitDetail v={detail.data} />
            )
          ) : null}
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
      <div>
        Berat: {ex.weight ?? "-"} kg, Suhu: {ex.temperature ?? "-"} °C
      </div>
      <div>Catatan: {ex.notes ?? "-"}</div>
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
