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

export function UsersCrud({ initial }: { initial: any[] }) {
  const [items, setItems] = React.useState<any[]>(Array.isArray(initial) ? initial : []);
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [accountRole, setAccountRole] = React.useState("SUPERVISOR");
  const [staffId, setStaffId] = React.useState("");
  const [staffs, setStaffs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("ALL");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [roleDraft, setRoleDraft] = React.useState<Record<number, string>>({});
  const [pwdDraft, setPwdDraft] = React.useState<Record<number, string>>({});

  React.useEffect(() => {
    void (async () => {
      const res = await fetch("/api/staff", { cache: "no-store" });
      const data = await res.json().catch(() => []);
      if (Array.isArray(data)) setStaffs(data);
    })();
  }, []);

  async function createUser() {
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, accountRole, staffId: staffId ? Number(staffId) : undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setItems((prev) => [...prev, data]);
        setUsername("");
        setPassword("");
        setAccountRole("SUPERVISOR");
        setStaffId("");
        setPage(1);
      } else {
        alert(data?.message ?? "Gagal membuat user");
      }
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(id: number) {
    if (!confirm("Hapus user ini?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((x) => x.id !== id));
  }

  const displayItems = items.filter((u) => {
    const q = query.trim().toLowerCase();
    const okQuery =
      !q ||
      String(u.username ?? "")
        .toLowerCase()
        .includes(q);
    const okRole = roleFilter === "ALL" || String(u.accountRole ?? "").toUpperCase() === roleFilter;
    return okQuery && okRole;
  });

  const totalPages = Math.max(1, Math.ceil(displayItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageItems = displayItems.slice(startIdx, startIdx + pageSize);

  React.useEffect(() => {
    // reset to page 1 when filters change
    setPage(1);
  }, [query, roleFilter]);

  function roleVariant(role?: string): "default" | "secondary" | "destructive" | "outline" {
    const r = String(role ?? "").toUpperCase();
    if (r === "ADMIN") return "secondary";
    if (r === "MASTER") return "default";
    if (r === "SUPERVISOR") return "outline";
    return "outline";
  }

  return (
    <div className="grid gap-4">
      <Collapsible defaultOpen={false}>
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Tambah User</div>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm">
              Buka/Tutup
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-5">
            <div className="grid gap-1">
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label>Account Role</Label>
              <Select value={accountRole} onValueChange={setAccountRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MASTER">MASTER</SelectItem>
                  <SelectItem value="SUPERVISOR">SUPERVISOR</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label>Staff</Label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih staff" />
                </SelectTrigger>
                <SelectContent>
                  {staffs.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      #{s.id} — {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => void createUser()}
                disabled={loading || !username || !password || !staffId}
                className="w-full"
              >
                {loading ? "Menyimpan..." : "Tambah User"}
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        <div className="grid gap-1 sm:col-span-2">
          <Label>Cari Username</Label>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari..." />
        </div>
        <div className="grid gap-1 sm:col-span-1">
          <Label>Filter Role</Label>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">SEMUA</SelectItem>
              <SelectItem value="MASTER">MASTER</SelectItem>
              <SelectItem value="SUPERVISOR">SUPERVISOR</SelectItem>
              <SelectItem value="ADMIN">ADMIN</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <div className="bg-muted/30 grid grid-cols-5 gap-2 border-b p-2 text-xs font-medium">
          <div>ID</div>
          <div>Username</div>
          <div>Role</div>
          <div>Staff</div>
          <div className="text-right">Aksi</div>
        </div>
        <div className="divide-y">
          {displayItems.length === 0 ? (
            <div className="text-muted-foreground p-4 text-center text-sm">Tidak ada data</div>
          ) : (
            pageItems.map((u) => (
              <div key={u.id} className="grid grid-cols-5 items-center gap-2 p-2 text-sm">
                <div>#{u.id}</div>
                <div className="truncate">{u.username}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={roleDraft[u.id] ?? String(u.accountRole ?? "")}
                      onValueChange={(v) => setRoleDraft((prev) => ({ ...prev, [u.id]: v }))}
                    >
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MASTER">MASTER</SelectItem>
                        <SelectItem value="SUPERVISOR">SUPERVISOR</SelectItem>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge variant={roleVariant(u.accountRole)}>{String(u.accountRole ?? "-")}</Badge>
                  </div>
                </div>
                <div className="truncate">{u.staff?.name ?? "-"}</div>
                <div className="flex items-center justify-end gap-2">
                  <Input
                    type="password"
                    className="h-8 w-[140px]"
                    placeholder="Password baru"
                    value={pwdDraft[u.id] ?? ""}
                    onChange={(e) => setPwdDraft((prev) => ({ ...prev, [u.id]: e.target.value }))}
                  />
                  <Button
                    size="sm"
                    onClick={async () => {
                      const newRole = roleDraft[u.id] ?? String(u.accountRole ?? "");
                      const newPwd = pwdDraft[u.id];
                      const body: any = {};
                      if (newRole && newRole !== u.accountRole) body.accountRole = newRole;
                      if (newPwd) body.password = newPwd;
                      if (!body.accountRole && !body.password) return; // nothing to save
                      const res = await fetch(`/api/users/${u.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(body),
                      });
                      if (res.ok) {
                        setItems((prev) =>
                          prev.map((it) => (it.id === u.id ? { ...it, accountRole: newRole || it.accountRole } : it)),
                        );
                        setPwdDraft((prev) => ({ ...prev, [u.id]: "" }));
                      } else {
                        const err = await res.json().catch(() => ({}));
                        alert(err?.message ?? "Gagal menyimpan perubahan");
                      }
                    }}
                  >
                    Simpan
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => void deleteUser(u.id)}>
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
