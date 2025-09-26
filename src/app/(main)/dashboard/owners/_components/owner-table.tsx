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
      const ow = e.detail as OwnerRow;
      window.location.href = `/dashboard/owners/${ow.id}`;
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
          {null}
          <DataTablePagination table={table} />
        </CardContent>
      </Card>
    </div>
  );
}
