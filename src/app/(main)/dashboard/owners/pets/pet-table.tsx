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
      ? json.items
          .filter((p: any) => String(p?.name ?? "").toLowerCase() !== "petshop")
          .map((p: any) => ({
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
  const [ownersLoaded, setOwnersLoaded] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (!dialogOpen || ownersLoaded) return;
    (async () => {
      const res = await fetch(`/api/owners?page=1&pageSize=100`, { cache: "no-store" });
      const json = await res.json().catch(() => ({ items: [] }));
      const items = Array.isArray(json.items) ? json.items : [];
      setOwners(items.map((o: any) => ({ id: o.id, name: o.name })));
      setOwnersLoaded(true);
    })();
  }, [dialogOpen, ownersLoaded]);

  const [editPet, setEditPet] = React.useState<PetRow | null>(null);
  const [editForm, setEditForm] = React.useState<{ name: string; species: string; breed: string; birthdate: string }>({
    name: "",
    species: "",
    breed: "",
    birthdate: "",
  });

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
    setDialogOpen(false);
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
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
