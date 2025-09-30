"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function StaffCrud({ initial }: { initial: any[] }) {
  const [items, setItems] = React.useState<any[]>(Array.isArray(initial) ? initial : []);
  const [name, setName] = React.useState("");
  const [jobRole, setJobRole] = React.useState("SUPERVISOR");
  const [loading, setLoading] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("ALL");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  // inline edit removed; using modal
  const [editStaff, setEditStaff] = React.useState<any | null>(null);
  const [editForm, setEditForm] = React.useState<{ name: string; jobRole: string }>({
    name: "",
    jobRole: "SUPERVISOR",
  });
  const [savingId, setSavingId] = React.useState<number | null>(null);

  async function createStaff() {
    setLoading(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, jobRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setItems((prev) => [...prev, data]);
        setName("");
        setJobRole("SUPERVISOR");
      } else {
        alert(data?.message ?? "Gagal membuat staff");
      }
    } finally {
      setLoading(false);
    }
  }

  async function deleteStaff(id: number) {
    if (!confirm("Hapus staff ini?")) return;
    const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((x) => x.id !== id));
  }

  const displayItems = items.filter((s) => {
    const q = query.trim().toLowerCase();
    const okQuery =
      !q ||
      String(s.name ?? "")
        .toLowerCase()
        .includes(q);
    const okRole = roleFilter === "ALL" || String(s.jobRole ?? "").toUpperCase() === roleFilter;
    return okQuery && okRole;
  });

  const totalPages = Math.max(1, Math.ceil(displayItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageItems = displayItems.slice(startIdx, startIdx + pageSize);

  React.useEffect(() => {
    setPage(1);
  }, [query, roleFilter]);

  function roleVariant(role?: string): "default" | "secondary" | "destructive" | "outline" {
    const r = String(role ?? "").toUpperCase();
    if (r === "ADMIN") return "secondary";
    if (r === "SUPERVISOR") return "default";
    if (r === "DOCTOR") return "outline";
    if (r === "PARAVET") return "outline";
    if (r === "GROOMER") return "outline";
    return "outline";
  }

  return (
    <div className="grid gap-4">
      <Collapsible defaultOpen={false}>
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Tambah Staff</div>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm">
              Buka/Tutup
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-5">
            <div className="grid gap-1">
              <Label>Nama</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label>Job Role</Label>
              <Select value={jobRole} onValueChange={setJobRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jabatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPERVISOR">SUPERVISOR</SelectItem>
                  <SelectItem value="DOCTOR">DOCTOR</SelectItem>
                  <SelectItem value="PARAVET">PARAVET</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="GROOMER">GROOMER</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={() => void createStaff()} disabled={loading || !name} className="w-full">
                {loading ? "Menyimpan..." : "Tambah Staff"}
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        <div className="grid gap-1 sm:col-span-2">
          <Label>Cari Nama</Label>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari..." />
        </div>
        <div className="grid gap-1 sm:col-span-1">
          <Label>Filter Jabatan</Label>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih jabatan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">SEMUA</SelectItem>
              <SelectItem value="SUPERVISOR">SUPERVISOR</SelectItem>
              <SelectItem value="DOCTOR">DOCTOR</SelectItem>
              <SelectItem value="PARAVET">PARAVET</SelectItem>
              <SelectItem value="ADMIN">ADMIN</SelectItem>
              <SelectItem value="GROOMER">GROOMER</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <th className="w-12 p-2 text-center">#</th>
              <th className="p-2">Nama</th>
              <th className="p-2">Jabatan</th>
              <th className="p-2">User</th>
              <th className="p-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.length === 0 ? (
              <tr>
                <td className="text-muted-foreground p-3 text-center" colSpan={5}>
                  Tidak ada data
                </td>
              </tr>
            ) : (
              pageItems.map((s) => (
                <tr key={s.id} className="hover:bg-muted/40 border-t">
                  <td className="w-12 p-2 text-center tabular-nums">{s.id}</td>
                  <td className="p-2 font-medium">{s.name}</td>
                  <td className="p-2">
                    <div className="inline-flex items-center gap-2">
                      <Badge variant={roleVariant(s.jobRole)}>{String(s.jobRole ?? "-")}</Badge>
                    </div>
                  </td>
                  <td className="p-2 font-mono text-xs">{s.user?.username ?? "-"}</td>
                  <td className="p-2">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditStaff(s);
                          setEditForm({ name: String(s.name ?? ""), jobRole: String(s.jobRole ?? "SUPERVISOR") });
                        }}
                      >
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => void deleteStaff(s.id)}>
                        Hapus
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {displayItems.length > pageSize ? (
        <Pagination className="mt-2">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((p) => Math.max(1, p - 1));
                }}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  href="#"
                  isActive={currentPage === i + 1}
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(i + 1);
                  }}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((p) => Math.min(totalPages, p + 1));
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}

      {/* Edit Modal */}
      <Dialog open={!!editStaff} onOpenChange={(o) => !o && setEditStaff(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1">
              <Label>Nama</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label>Job Role</Label>
              <Select value={editForm.jobRole} onValueChange={(v) => setEditForm((f) => ({ ...f, jobRole: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jabatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPERVISOR">SUPERVISOR</SelectItem>
                  <SelectItem value="DOCTOR">DOCTOR</SelectItem>
                  <SelectItem value="PARAVET">PARAVET</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="GROOMER">GROOMER</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditStaff(null)}>
                Batal
              </Button>
              <Button
                onClick={async () => {
                  if (!editStaff) return;
                  const id = Number(editStaff.id);
                  const body: any = {};
                  if (editForm.name && editForm.name !== editStaff.name) body.name = editForm.name.trim();
                  if (editForm.jobRole && editForm.jobRole !== editStaff.jobRole) body.jobRole = editForm.jobRole;
                  if (!body.name && !body.jobRole) {
                    setEditStaff(null);
                    return;
                  }
                  setSavingId(id);
                  const res = await fetch(`/api/staff/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                  });
                  setSavingId(null);
                  if (res.ok) {
                    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...body } : it)));
                    setEditStaff(null);
                  } else {
                    const err = await res.json().catch(() => ({}));
                    alert(err?.message ?? "Gagal menyimpan perubahan");
                  }
                }}
                disabled={savingId === (editStaff?.id ?? null)}
              >
                {savingId === (editStaff?.id ?? null) ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
