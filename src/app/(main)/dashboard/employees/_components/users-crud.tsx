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
  const [editUser, setEditUser] = React.useState<any | null>(null);
  const [editForm, setEditForm] = React.useState<{ accountRole: string; password?: string }>({
    accountRole: "SUPERVISOR",
    password: "",
  });
  const [savingId, setSavingId] = React.useState<number | null>(null);

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

      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <th className="w-12 p-2 text-center">#</th>
              <th className="p-2">Username</th>
              <th className="p-2">Role</th>
              <th className="p-2">Staff</th>
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
              pageItems.map((u) => (
                <tr key={u.id} className="hover:bg-muted/40 border-t">
                  <td className="w-12 p-2 text-center tabular-nums">{u.id}</td>
                  <td className="p-2 font-medium">{u.username}</td>
                  <td className="p-2">
                    <Badge variant={roleVariant(u.accountRole)}>{String(u.accountRole ?? "-")}</Badge>
                  </td>
                  <td className="p-2">{u.staff?.name ?? "-"}</td>
                  <td className="p-2">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditUser(u);
                          setEditForm({ accountRole: String(u.accountRole ?? "SUPERVISOR"), password: "" });
                        }}
                      >
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => void deleteUser(u.id)}>
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

      {/* Edit User Modal */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1">
              <Label>Username</Label>
              <Input value={String(editUser?.username ?? "")} disabled />
            </div>
            <div className="grid gap-1">
              <Label>Account Role</Label>
              <Select
                value={editForm.accountRole}
                onValueChange={(v) => setEditForm((f) => ({ ...f, accountRole: v }))}
              >
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
              <Label>Password Baru (opsional)</Label>
              <Input
                type="password"
                value={editForm.password ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditUser(null)}>
                Batal
              </Button>
              <Button
                onClick={async () => {
                  if (!editUser) return;
                  const id = Number(editUser.id);
                  const body: any = {};
                  if (editForm.accountRole && editForm.accountRole !== editUser.accountRole)
                    body.accountRole = editForm.accountRole;
                  if (editForm.password) body.password = editForm.password;
                  if (!body.accountRole && !body.password) {
                    setEditUser(null);
                    return;
                  }
                  setSavingId(id);
                  const res = await fetch(`/api/users/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                  });
                  setSavingId(null);
                  if (res.ok) {
                    setItems((prev) =>
                      prev.map((it) =>
                        it.id === id ? { ...it, accountRole: body.accountRole ?? it.accountRole } : it,
                      ),
                    );
                    setEditUser(null);
                  } else {
                    const err = await res.json().catch(() => ({}));
                    alert(err?.message ?? "Gagal menyimpan perubahan");
                  }
                }}
                disabled={savingId === (editUser?.id ?? null)}
              >
                {savingId === (editUser?.id ?? null) ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
