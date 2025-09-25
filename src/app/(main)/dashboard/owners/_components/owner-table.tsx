"use client";

import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { withIndexColumn } from "@/components/data-table/table-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { ownerColumns, type OwnerRow } from "./columns";
import { NewOwnerInline } from "./new-owner-inline";

export function OwnerTable({
  initial,
}: {
  initial: { items: OwnerRow[]; total: number; page: number; pageSize: number };
}) {
  const [data, setData] = React.useState(initial);
  const [role, setRole] = React.useState<string>("");
  const [editOwner, setEditOwner] = React.useState<OwnerRow | null>(null);
  const [editForm, setEditForm] = React.useState<{ name: string; phone: string; email?: string; address: string }>({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [viewOwner, setViewOwner] = React.useState<OwnerRow | null>(null);
  const [viewDetail, setViewDetail] = React.useState<null | {
    id: number;
    name: string;
    phone: string;
    email?: string;
    address: string;
    pets: Array<{ id: number; name: string; species: string; breed: string; birthdate?: string }>;
  }>(null);

  const columns = React.useMemo(() => withIndexColumn(ownerColumns), []);
  const table = useDataTableInstance({ data: data.items, columns, getRowId: (row) => row.id.toString() });

  async function refresh() {
    const res = await fetch(`/api/owners?page=${data.page}&pageSize=${data.pageSize}`, { cache: "no-store" });
    if (res.ok) setData(await res.json());
  }

  React.useEffect(() => {
    (async () => {
      const me = await fetch("/api/users/me", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      if (me?.accountRole) setRole(me.accountRole);
    })();
    function onEdit(e: any) {
      const ow = e.detail as OwnerRow;
      setEditOwner(ow);
      setEditForm({ name: ow.name, phone: ow.phone, email: ow.email ?? "", address: ow.address });
    }
    async function onDelete(e: any) {
      const ow = e.detail as OwnerRow;
      if (!confirm("Hapus owner ini?")) return;
      await fetch(`/api/owners/${ow.id}`, { method: "DELETE" });
      await refresh();
    }
    function onView(e: any) {
      setViewOwner(e.detail as OwnerRow);
    }
    document.addEventListener("owner:edit", onEdit as any);
    document.addEventListener("owner:delete", onDelete as any);
    document.addEventListener("owner:view", onView as any);
    return () => {
      document.removeEventListener("owner:edit", onEdit as any);
      document.removeEventListener("owner:delete", onDelete as any);
      document.removeEventListener("owner:view", onView as any);
    };
  }, []);

  React.useEffect(() => {
    (async () => {
      if (!viewOwner) {
        setViewDetail(null);
        return;
      }
      const res = await fetch(`/api/owners/${viewOwner.id}`, { cache: "no-store" });
      if (!res.ok) {
        setViewDetail(null);
        return;
      }
      const json = await res.json().catch(() => null);
      if (json) setViewDetail(json);
    })();
  }, [viewOwner]);

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs">
      <Card>
        <CardHeader>
          <CardTitle>Owners</CardTitle>
          <CardDescription>Manage pet owners and their pets.</CardDescription>
          <CardAction>
            <div className="flex items-center gap-2">
              <DataTableViewOptions table={table} />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex size-full flex-col gap-4">
          <NewOwnerInline onCreated={refresh} />
          <div className="flex items-center gap-2">
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Cari owner (nama/email/telepon/alamat)"
              onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
            />
          </div>
          <div className="overflow-hidden rounded-md border">
            <DataTable table={table} columns={columns} />
          </div>
          <Dialog open={!!editOwner} onOpenChange={(o) => !o && setEditOwner(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Owner</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <Input
                  placeholder="Nama"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
                <Input
                  placeholder="Phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                />
                <Input
                  placeholder="Email"
                  value={editForm.email ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                />
                <Input
                  placeholder="Address"
                  value={editForm.address}
                  onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditOwner(null)}>
                    Batal
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!editOwner) return;
                      await fetch(`/api/owners/${editOwner.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(editForm),
                      });
                      setEditOwner(null);
                      await refresh();
                    }}
                  >
                    Simpan
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={!!viewOwner} onOpenChange={(o) => !o && setViewOwner(null)}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Biodata Owner</DialogTitle>
              </DialogHeader>
              {viewDetail ? (
                <div className="grid gap-3 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-muted-foreground">Nama</div>
                    <div className="col-span-2 font-medium">{viewDetail.name}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-muted-foreground">Email</div>
                    <div className="col-span-2">{viewDetail.email ?? "-"}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-muted-foreground">Phone</div>
                    <div className="col-span-2">{viewDetail.phone}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-muted-foreground">Address</div>
                    <div className="col-span-2">{viewDetail.address}</div>
                  </div>
                  <div className="grid gap-2">
                    <div className="text-sm font-semibold">Pets</div>
                    {Array.isArray(viewDetail.pets) && viewDetail.pets.length ? (
                      <div className="rounded-md border">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/60 text-left">
                            <tr>
                              <th className="w-10 p-2 text-center">#</th>
                              <th className="p-2">Nama</th>
                              <th className="p-2">Jenis</th>
                              <th className="p-2">Ras</th>
                              <th className="p-2">Lahir</th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewDetail.pets.map((p, idx) => (
                              <tr key={p.id} className="border-t">
                                <td className="w-10 p-2 text-center tabular-nums">{idx + 1}</td>
                                <td className="p-2 font-medium">{p.name}</td>
                                <td className="p-2">{p.species}</td>
                                <td className="p-2">{p.breed}</td>
                                <td className="p-2">
                                  {p.birthdate ? new Date(p.birthdate).toLocaleDateString() : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-xs">Belum ada hewan</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">Memuat...</div>
              )}
            </DialogContent>
          </Dialog>
          <DataTablePagination table={table} />
        </CardContent>
      </Card>
    </div>
  );
}
