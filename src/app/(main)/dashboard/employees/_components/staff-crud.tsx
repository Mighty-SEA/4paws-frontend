"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  const [nameDraft, setNameDraft] = React.useState<Record<number, string>>({});
  const [roleDraft, setRoleDraft] = React.useState<Record<number, string>>({});

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

      <div className="rounded-md border">
        <div className="bg-muted/30 grid grid-cols-5 gap-2 border-b p-2 text-xs font-medium">
          <div>ID</div>
          <div>Nama</div>
          <div>Jabatan</div>
          <div>User</div>
          <div className="text-right">Aksi</div>
        </div>
        <div className="divide-y">
          {displayItems.length === 0 ? (
            <div className="text-muted-foreground p-4 text-center text-sm">Tidak ada data</div>
          ) : (
            pageItems.map((s) => (
              <div key={s.id} className="grid grid-cols-5 items-center gap-2 p-2 text-sm">
                <div>#{s.id}</div>
                <div className="truncate">
                  <Input
                    className="h-8"
                    value={nameDraft[s.id] ?? String(s.name ?? "")}
                    onChange={(e) => setNameDraft((prev) => ({ ...prev, [s.id]: e.target.value }))}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={roleDraft[s.id] ?? String(s.jobRole ?? "")}
                      onValueChange={(v) => setRoleDraft((prev) => ({ ...prev, [s.id]: v }))}
                    >
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUPERVISOR">SUPERVISOR</SelectItem>
                        <SelectItem value="DOCTOR">DOCTOR</SelectItem>
                        <SelectItem value="PARAVET">PARAVET</SelectItem>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                        <SelectItem value="GROOMER">GROOMER</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge variant={roleVariant(s.jobRole)}>{String(s.jobRole ?? "-")}</Badge>
                  </div>
                </div>
                <div className="truncate">{s.user?.username ?? "-"}</div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      const nameNew = (nameDraft[s.id] ?? String(s.name ?? "")).trim();
                      const roleNew = roleDraft[s.id] ?? String(s.jobRole ?? "");
                      const body: any = {};
                      if (nameNew && nameNew !== s.name) body.name = nameNew;
                      if (roleNew && roleNew !== s.jobRole) body.jobRole = roleNew;
                      if (!body.name && !body.jobRole) return;
                      const res = await fetch(`/api/staff/${s.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(body),
                      });
                      if (res.ok) {
                        setItems((prev) => prev.map((it) => (it.id === s.id ? { ...it, ...body } : it)));
                      } else {
                        const err = await res.json().catch(() => ({}));
                        alert(err?.message ?? "Gagal menyimpan perubahan");
                      }
                    }}
                  >
                    Simpan
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => void deleteStaff(s.id)}>
                    Hapus
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
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
    </div>
  );
}
