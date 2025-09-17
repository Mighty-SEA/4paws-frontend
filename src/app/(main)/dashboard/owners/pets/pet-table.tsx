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
            <DataTable table={table} columns={table.options.columns as any} />
          </div>
          <DataTablePagination table={table} />
        </CardContent>
      </Card>
    </div>
  );
}
